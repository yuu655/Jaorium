import { stripe } from "@/lib/stripe";
import { isRetryableStripeError } from "@/lib/stripeRetry";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const PAYOUT_FEE = 250;
const MIN_PAYOUT_AMOUNT = 1000;
const UNIQUE_VIOLATION = "23505";

// ---- 純粋ロジック ----

function extractBearerToken(authHeader) {
  return authHeader?.replace("Bearer ", "");
}

function calculateTransferAmount(balance, fee) {
  return balance - fee;
}

// ---- I/O（Supabase / Stripe呼び出し） ----

async function authenticateMentor(supabase, token) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

async function fetchMentorPayoutInfo(supabase, mentorId) {
  // Stripe連携情報は機密テーブル mentor_secret にある（本ルートは service role なのでRLS外）
  const { data, error } = await supabase
    .from("mentor_secret")
    .select("stripe_account_id, stripe_onboarding_completed")
    .eq("id", mentorId)
    .single();
  if (error || !data) return null;
  return data;
}

async function fetchMentorBalance(supabase, mentorId) {
  const { data, error } = await supabase
    .from("mentor_balances")
    .select("balance")
    .eq("mentor_id", mentorId)
    .single();
  if (error || !data) return null;
  return data;
}

// 二重送金防止: 送金の前に「処理中」の行を確保する。
// transfers_one_processing_per_mentor 部分ユニークインデックスにより、
// 同一メンターの並行リクエストはここでUNIQUE違反(23505)になり1件しか通らない。
async function claimProcessingTransfer(supabase, { mentorId, amount }) {
  const { data, error } = await supabase
    .from("transfers")
    .insert({
      mentor_id: mentorId,
      amount,
      payout_fee: PAYOUT_FEE,
      status: "processing",
    })
    .select()
    .single();
  return { record: data, error };
}

async function createStripeTransfer({ amount, destination, mentorId, idempotencyKey }) {
  return stripe.transfers.create(
    {
      amount,
      currency: "jpy",
      destination,
      metadata: {
        mentor_id: mentorId,
      },
    },
    // 確保したtransfers行のIDをキーにすることで、ネットワーク再送等で
    // Stripe API呼び出しが重複しても送金は1回しか実行されない
    { idempotencyKey },
  );
}

async function markTransferCompleted(supabase, { transferId, stripeTransferId }) {
  await supabase
    .from("transfers")
    .update({ stripe_transfer_id: stripeTransferId, status: "completed" })
    .eq("id", transferId);
}

async function markTransferFailed(supabase, { transferId, status, errorReason }) {
  await supabase
    .from("transfers")
    .update({ status, error_reason: errorReason })
    .eq("id", transferId);
}

async function recordBalanceConsumption(supabase, { mentorId, consumedAmount, transferId }) {
  await supabase.from("mentor_balance_logs").insert({
    mentor_id: mentorId,
    change: -consumedAmount,
    reason: "payout",
    transfer_id: transferId,
  });
}

// ---- ハンドラ（オーケストレーション） ----

export async function POST(req) {
  const supabase = createAdminSupabaseClient();

  const token = extractBearerToken(req.headers.get("authorization"));
  const user = await authenticateMentor(supabase, token);
  if (!user) {
    return Response.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const mentor = await fetchMentorPayoutInfo(supabase, user.id);
  if (!mentor) {
    return Response.json({ error: "メンター情報が取得できません" }, { status: 404 });
  }
  if (!mentor.stripe_onboarding_completed || !mentor.stripe_account_id) {
    return Response.json({ error: "口座登録が完了していません" }, { status: 400 });
  }

  const balance = await fetchMentorBalance(supabase, user.id);
  if (!balance) {
    return Response.json({ error: "残高情報が取得できません" }, { status: 404 });
  }
  if (balance.balance < MIN_PAYOUT_AMOUNT) {
    return Response.json(
      { error: `最低振込金額（¥${MIN_PAYOUT_AMOUNT}）に達していません` },
      { status: 400 },
    );
  }

  const transferAmount = calculateTransferAmount(balance.balance, PAYOUT_FEE);

  const { record: processing, error: claimError } = await claimProcessingTransfer(supabase, {
    mentorId: user.id,
    amount: transferAmount,
  });

  if (claimError) {
    if (claimError.code === UNIQUE_VIOLATION) {
      return Response.json(
        { error: "振込処理が進行中です。しばらく待ってから再度お試しください" },
        { status: 409 },
      );
    }
    console.error("Failed to claim processing transfer:", claimError);
    return Response.json({ error: "振込の開始に失敗しました" }, { status: 500 });
  }

  try {
    const transfer = await createStripeTransfer({
      amount: transferAmount,
      destination: mentor.stripe_account_id,
      mentorId: user.id,
      idempotencyKey: processing.id,
    });

    await markTransferCompleted(supabase, {
      transferId: processing.id,
      stripeTransferId: transfer.id,
    });

    await recordBalanceConsumption(supabase, {
      mentorId: user.id,
      consumedAmount: balance.balance,
      transferId: processing.id,
    });

    return Response.json({ success: true, amount: transferAmount });
  } catch (err) {
    console.error("Payout failed:", err);

    await markTransferFailed(supabase, {
      transferId: processing.id,
      status: isRetryableStripeError(err.code) ? "pending" : "failed",
      errorReason: err.message,
    });

    return Response.json({ error: "振込に失敗しました" }, { status: 500 });
  }
}
