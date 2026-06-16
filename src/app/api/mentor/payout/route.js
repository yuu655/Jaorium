import { createClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";

const PAYOUT_FEE = 250;
const MIN_PAYOUT_AMOUNT = 1000;

export async function POST(req) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_SECRET_KEY
  );

  // 認証確認
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return Response.json({ error: "ログインが必要です" }, { status: 401 });
  }

  // メンター情報を取得
  const { data: mentor, error: mentorError } = await supabase
    .from("mentors")
    .select("stripe_account_id, stripe_onboarding_completed")
    .eq("id", user.id)
    .single();

  if (mentorError || !mentor) {
    return Response.json({ error: "メンター情報が取得できません" }, { status: 404 });
  }

  if (!mentor.stripe_onboarding_completed || !mentor.stripe_account_id) {
    return Response.json({ error: "口座登録が完了していません" }, { status: 400 });
  }

  // 残高確認
  const { data: balance, error: balanceError } = await supabase
    .from("mentor_balances")
    .select("balance")
    .eq("mentor_id", user.id)
    .single();

  if (balanceError || !balance) {
    return Response.json({ error: "残高情報が取得できません" }, { status: 404 });
  }

  if (balance.balance < MIN_PAYOUT_AMOUNT) {
    return Response.json({ error: `最低振込金額（¥${MIN_PAYOUT_AMOUNT}）に達していません` }, { status: 400 });
  }

  const transferAmount = balance.balance - PAYOUT_FEE;

  try {
    // Stripe Transfer実行
    const transfer = await stripe.transfers.create({
      amount: transferAmount,
      currency: "jpy",
      destination: mentor.stripe_account_id,
      metadata: {
        mentor_id: user.id,
      },
    });

    // transfersにINSERT
    const { data: transferRecord } = await supabase
      .from("transfers")
      .insert({
        mentor_id: user.id,
        stripe_transfer_id: transfer.id,
        amount: transferAmount,
        payout_fee: PAYOUT_FEE,
        status: "completed",
      })
      .select()
      .single();

    // mentor_balance_logsにINSERT（トリガーでbalanceが自動で減算）
    await supabase.from("mentor_balance_logs").insert({
      mentor_id: user.id,
      change: -balance.balance, // 残高全額を消費
      reason: "payout",
      transfer_id: transferRecord.id,
    });

    return Response.json({ success: true, amount: transferAmount });
  } catch (err) {
    console.error("Payout failed:", err);

    const retryable = ["insufficient_funds", "rate_limit", "api_connection_error"].includes(err.code);

    await supabase.from("transfers").insert({
      mentor_id: user.id,
      amount: transferAmount,
      payout_fee: PAYOUT_FEE,
      status: retryable ? "pending" : "failed",
      error_reason: err.message,
    });

    return Response.json({ error: "振込に失敗しました" }, { status: 500 });
  }
}