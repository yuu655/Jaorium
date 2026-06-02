"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";
import { revalidateTag } from "next/cache";
import getUrls from "@/utils/getUrls";
import { redirect } from "next/navigation";

async function getMeetingWithAuth(supabase, meetingId, userId) {
  const { data: meeting } = await supabase
    .from("meetings")
    .select("*")
    .eq("id", meetingId)
    .single();
  if (
    !meeting ||
    (meeting.user !== userId && meeting.mentor !== userId)
  )
    return null;
  return meeting;
}

// 両者のダッシュボードキャッシュを破棄するヘルパー
function revalidateDashboards(meeting) {
  revalidateTag(`dashboard-user-${meeting.user}`);
  revalidateTag(`dashboard-mentor-${meeting.mentor}`);
}

// 日時確定
export async function confirmDate(meetingId, date, time) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const meeting = await getMeetingWithAuth(
    supabase,
    meetingId,
    user.id,
  );
  if (!meeting) return { error: "権限がありません" };
  const response = await fetch(`${getUrls()}/api/meeting/${meetingId}`, {
    method: "PATCH",
    headers: { "x-api-key": process.env.NEXT_APIROUTE_SECRET },
    body: JSON.stringify({
      action: "set_schedule",
      date: date,
      time: time,
    }),
  });

  console.log(response)
  if (!response.ok) {
    // APIが4xx/5xxを返した場合
    // return { error: data.error ?? 'エラーが発生しました' };
    const text = await response.text(); // HTMLでも読める
  console.error('API error:', response.status, text);
  return { error: 'APIエラー' };
  }

  // const { error } = await supabase
  //   .from("meetings")
  //   .update({ is_commit: true, date, time })
  //   .eq("id", meetingId);

  // if (error) return { error: "確定に失敗しました" };
  
  revalidateDashboards(meeting);
  return { success: true };
}

// 日時リセット
export async function resetDate(meetingId) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const meeting = await getMeetingWithAuth(supabase, meetingId, user.id);
  if (!meeting) return { error: "権限がありません" };

  const response = await fetch(`${getUrls()}/api/meeting/${meetingId}`, {
    method: "PATCH",
    headers: { "x-api-key": process.env.NEXT_APIROUTE_SECRET },
    body: JSON.stringify({
      action: "delete_schedule",
    }),
  });

  if (!response.ok) {
    // APIが4xx/5xxを返した場合
    return { error: data.error ?? 'エラーが発生しました' };
  }

  // const { error } = await supabase
  //   .from("meetings")
  //   .update({ is_commit: false, date: null, time: null })
  //   .eq("id", meetingId);

  // if (error) return { error: "リセットに失敗しました" };
  revalidateDashboards(meeting);
  return { success: true };
}

// 日時提案メッセージを送る
export async function sendDateProposal(meetingId, date, time) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const meeting = await getMeetingWithAuth(supabase, meetingId, user.id);
  if (!meeting) return { error: "権限がありません" };

  const { error } = await supabase.from("messages").insert({
    meeting_id: meetingId,
    sender_id: user.id,
    content: `${date}|${time}`,
    type: "date_proposal",
  });

  if (error) return { error: "送信に失敗しました" };
  return { success: true };
}

// ミーティング終了を申請
export async function requestFinish(meetingId) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const meeting = await getMeetingWithAuth(supabase, meetingId, user.id);
  if (!meeting) return { error: "権限がありません" };

  const { error } = await supabase
    .from("meetings")
    .update({ finish_requested_by: user.id })
    .eq("id", meetingId);

  if (error) return { error: "申請に失敗しました" };
  return { success: true };
}

// ミーティング終了を承認
export async function approveFinish(meetingId) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const meeting = await getMeetingWithAuth(supabase, meetingId, user.id);
  if (!meeting) return { error: "権限がありません" };

  if (meeting.finish_requested_by === user.id)
    return { error: "自分の申請は承認できません" };

  const response = await fetch(`${getUrls()}/api/meeting/${meetingId}`, {
    method: "PATCH",
    headers: { "x-api-key": process.env.NEXT_APIROUTE_SECRET },
    body: JSON.stringify({
      action: "finish",
    }),
  });

  if (!response.ok) {
    // APIが4xx/5xxを返した場合
    return { error: data.error ?? 'エラーが発生しました' };
  }

  const { error } = await supabase
    .from("meetings")
    .update({ finish_requested_by: null })
    .eq("id", meetingId);

  if (error) return { error: "終了に失敗しました" };
  
  revalidateDashboards(meeting); // 終了したら過去の相談に移動するのでキャッシュ破棄
  return { success: true };
}

// 終了申請をキャンセル
export async function cancelFinishRequest(meetingId) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const meeting = await getMeetingWithAuth(supabase, meetingId, user.id);
  if (!meeting) return { error: "権限がありません" };

  if (meeting.finish_requested_by !== user.id)
    return { error: "権限がありません" };

  const { error } = await supabase
    .from("meetings")
    .update({ finish_requested_by: null })
    .eq("id", meetingId);

  if (error) return { error: "キャンセルに失敗しました" };
  return { success: true };
}


export async function consumeCredit(meetingId) {
  // 認証済みユーザーの取得
  const supabaseAuth = await createClient();
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_SECRET_KEY,
  );
 
  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
  if (authError || !user) {
    return { error: "ログインが必要です" };
  }
 
  // Service Roleで操作（RLSをバイパス）
  // const supabase = createClient(
  //   process.env.NEXT_PUBLIC_SUPABASE_URL,
  //   process.env.NEXT_SECRET_KEY
  // );
 
  // 残高確認
  const { data: credit, error: creditError } = await supabase
    .from("credits")
    .select("balance")
    .eq("user_id", user.id)
    .single();
 
  if (creditError || !credit || credit.balance < 1) {
    return { error: "INSUFFICIENT_CREDITS" };
  }
 
  // consume_credit RPCで残高チェック＋消費をトランザクションで実行
  // → トリガーでbalance -1、meeting_confirmations INSERTが自動で行われる
  const { error: rpcError } = await supabase.rpc("consume_credit", {
    p_user_id: user.id,
    p_meeting_id: meetingId,
  });
 
  if (rpcError) {
    if (rpcError.message.includes("INSUFFICIENT_CREDITS")) {
      return { error: "INSUFFICIENT_CREDITS" };
    }
    console.error("consume_credit error:", rpcError);
    return { error: "クレジットの消費に失敗しました" };
  }
 
  return { success: true };
}

export async function redirectToCheckout(meetingId) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };
 
  const { data } = await supabase
    .from("users")
    .select("customer_id")
    .eq("id", user.id)
    .single();
 
  const session = await stripe.checkout.sessions.create({
    ...(data?.customer_id
      ? { customer: data.customer_id }
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
  });
 
  redirect(session.url);
}