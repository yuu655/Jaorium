"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { revalidateTag } from "next/cache";
import getUrls from "@/utils/getUrls";
import { redirect } from "next/navigation";

// ---- 純粋ロジック ----

function isMeetingParticipant(meeting, userId) {
  return Boolean(meeting) && (meeting.user === userId || meeting.mentor === userId);
}

function hasInsufficientCredits(balance) {
  return balance == null || balance < 1;
}

function isInsufficientCreditsError(error) {
  return Boolean(error?.message?.includes("INSUFFICIENT_CREDITS"));
}

function buildCreditCheckoutParams({ customerId, user, meetingId }) {
  return {
    ...(customerId
      ? { customer: customerId }
      : {
          customer_email: user.user_metadata.email,
          customer_creation: "always",
        }),
    line_items: [
      {
        price: "price_1TZOHlRbUCCpa1iAiLdVGIRj",
        quantity: 1,
      },
    ],
    mode: "payment",
    metadata: {
      supabase_user_id: user.id,
      credits_granted: 1,
    },
    success_url: `${getUrls()}/dashboard/chat/${meetingId}?success=true`,
    cancel_url: `${getUrls()}/dashboard/chat/${meetingId}?canceled=true`,
  };
}

// ---- I/O（Supabase / meeting API / Stripe呼び出し） ----

async function getAuthenticatedUser(supabase) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return { user, error };
}

async function fetchMeetingById(supabase, meetingId) {
  const { data: meeting } = await supabase
    .from("meetings")
    .select("*")
    .eq("id", meetingId)
    .single();
  return meeting;
}

async function getMeetingWithAuth(supabase, meetingId, userId) {
  const meeting = await fetchMeetingById(supabase, meetingId);
  return isMeetingParticipant(meeting, userId) ? meeting : null;
}

// 両者のダッシュボードキャッシュを破棄するヘルパー
function revalidateDashboards(meeting) {
  revalidateTag(`dashboard-user-${meeting.user}`);
  revalidateTag(`dashboard-mentor-${meeting.mentor}`);
}

// meeting APIへのPATCH呼び出し。confirmDate/resetDate/approveFinishで共通。
async function patchMeeting(meetingId, payload) {
  const response = await fetch(`${getUrls()}/api/meeting/${meetingId}`, {
    method: "PATCH",
    headers: { "x-api-key": process.env.NEXT_APIROUTE_SECRET },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("API error:", response.status, text);
    return { ok: false };
  }

  return { ok: true };
}

async function insertDateProposalMessage(supabase, { meetingId, senderId, date, time }) {
  return supabase.from("messages").insert({
    meeting_id: meetingId,
    sender_id: senderId,
    content: `${date}|${time}`,
    type: "date_proposal",
  });
}

async function setFinishRequestedBy(supabase, { meetingId, userId }) {
  return supabase.from("meetings").update({ finish_requested_by: userId }).eq("id", meetingId);
}

async function fetchCreditBalance(supabase, userId) {
  const { data, error } = await supabase
    .from("credits")
    .select("balance")
    .eq("user_id", userId)
    .single();
  if (error || !data) return null;
  return data.balance;
}

async function consumeCreditViaRpc(supabase, { userId, meetingId }) {
  return supabase.rpc("consume_credit", { p_user_id: userId, p_meeting_id: meetingId });
}

async function fetchStripeCustomerId(supabase, userId) {
  const { data } = await supabase.from("users").select("customer_id").eq("id", userId).single();
  return data?.customer_id ?? null;
}

async function createCreditCheckoutSession(params) {
  return stripe.checkout.sessions.create(params);
}

// ---- Server Actions（オーケストレーション） ----

// 日時確定
export async function confirmDate(meetingId, date, time) {
  const supabase = await createClient();
  const { user } = await getAuthenticatedUser(supabase);
  if (!user) return { error: "ログインが必要です" };

  const meeting = await getMeetingWithAuth(supabase, meetingId, user.id);
  if (!meeting) return { error: "権限がありません" };

  const { ok } = await patchMeeting(meetingId, { action: "set_schedule", date, time });
  if (!ok) return { error: "APIエラー" };

  revalidateDashboards(meeting);
  return { success: true };
}

// 日時リセット
export async function resetDate(meetingId) {
  const supabase = await createClient();
  const { user } = await getAuthenticatedUser(supabase);
  if (!user) return { error: "ログインが必要です" };

  const meeting = await getMeetingWithAuth(supabase, meetingId, user.id);
  if (!meeting) return { error: "権限がありません" };

  const { ok } = await patchMeeting(meetingId, { action: "delete_schedule" });
  if (!ok) return { error: "APIエラー" };

  revalidateDashboards(meeting);
  return { success: true };
}

// 日時提案メッセージを送る
export async function sendDateProposal(meetingId, date, time) {
  const supabase = await createClient();
  const { user } = await getAuthenticatedUser(supabase);
  if (!user) return { error: "ログインが必要です" };

  const meeting = await getMeetingWithAuth(supabase, meetingId, user.id);
  if (!meeting) return { error: "権限がありません" };

  const { error } = await insertDateProposalMessage(supabase, {
    meetingId,
    senderId: user.id,
    date,
    time,
  });

  if (error) return { error: "送信に失敗しました" };
  return { success: true };
}

// ミーティング終了を申請
export async function requestFinish(meetingId) {
  const supabase = await createClient();
  const { user } = await getAuthenticatedUser(supabase);
  if (!user) return { error: "ログインが必要です" };

  const meeting = await getMeetingWithAuth(supabase, meetingId, user.id);
  if (!meeting) return { error: "権限がありません" };

  const { error } = await setFinishRequestedBy(supabase, { meetingId, userId: user.id });

  if (error) return { error: "申請に失敗しました" };
  return { success: true };
}

// ミーティング終了を承認
export async function approveFinish(meetingId) {
  const supabase = await createClient();
  const { user } = await getAuthenticatedUser(supabase);
  if (!user) return { error: "ログインが必要です" };

  const meeting = await getMeetingWithAuth(supabase, meetingId, user.id);
  if (!meeting) return { error: "権限がありません" };

  if (meeting.finish_requested_by === user.id)
    return { error: "自分の申請は承認できません" };

  const { ok } = await patchMeeting(meetingId, { action: "finish" });
  if (!ok) return { error: "APIエラー" };

  const { error } = await setFinishRequestedBy(supabase, { meetingId, userId: null });

  if (error) return { error: "終了に失敗しました" };

  revalidateDashboards(meeting); // 終了したら過去の相談に移動するのでキャッシュ破棄
  return { success: true };
}

// 終了申請をキャンセル
export async function cancelFinishRequest(meetingId) {
  const supabase = await createClient();
  const { user } = await getAuthenticatedUser(supabase);
  if (!user) return { error: "ログインが必要です" };

  const meeting = await getMeetingWithAuth(supabase, meetingId, user.id);
  if (!meeting) return { error: "権限がありません" };

  if (meeting.finish_requested_by !== user.id)
    return { error: "権限がありません" };

  const { error } = await setFinishRequestedBy(supabase, { meetingId, userId: null });

  if (error) return { error: "キャンセルに失敗しました" };
  return { success: true };
}

export async function consumeCredit(meetingId) {
  const supabaseAuth = await createClient();
  const supabase = createAdminSupabaseClient();

  const { user, error: authError } = await getAuthenticatedUser(supabaseAuth);
  if (authError || !user) {
    return { error: "ログインが必要です" };
  }

  // service role でRPCを呼ぶ（RLS迂回）ため、meetingId が呼び出し者自身の面談か
  // をここで必ず検証する。クレジット消費は面談のユーザー（受験生）側だけが行う。
  const meeting = await fetchMeetingById(supabase, meetingId);
  if (!meeting || meeting.user !== user.id) {
    return { error: "権限がありません" };
  }

  const balance = await fetchCreditBalance(supabase, user.id);
  if (hasInsufficientCredits(balance)) {
    return { error: "INSUFFICIENT_CREDITS" };
  }

  // consume_credit RPCで残高チェック＋消費をトランザクションで実行
  // → トリガーでbalance -1、meeting_confirmations INSERTが自動で行われる
  const { error: rpcError } = await consumeCreditViaRpc(supabase, { userId: user.id, meetingId });

  if (rpcError) {
    if (isInsufficientCreditsError(rpcError)) {
      return { error: "INSUFFICIENT_CREDITS" };
    }
    console.error("consume_credit error:", rpcError);
    return { error: "クレジットの消費に失敗しました" };
  }

  return { success: true };
}

export async function redirectToCheckout(meetingId) {
  const supabase = await createClient();
  const { user } = await getAuthenticatedUser(supabase);
  if (!user) return { error: "ログインが必要です" };

  const customerId = await fetchStripeCustomerId(supabase, user.id);

  const session = await createCreditCheckoutSession(
    buildCreditCheckoutParams({ customerId, user, meetingId }),
  );

  redirect(session.url);
}
