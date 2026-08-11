import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import webpush from "web-push";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

function isAuthorizedWebhookRequest(secret) {
  return secret === process.env.SUPABASE_WEBHOOK_SECRET;
}

function buildPushPayload({ senderName, message, meetingId }) {
  const isDateProposal = message.type === "date_proposal";
  return {
    title: `${senderName}さんからメッセージ`,
    body: isDateProposal
      ? "日時の提案が届きました"
      : (message.content ?? "").slice(0, 80),
    url: `/dashboard/chat/${meetingId}`,
  };
}

// DMの受信者（面談参加者のうち送信者でない方）へWeb Pushを送る。
// 通知は補助機能なので、失敗してもwebhook自体は200で返す（Supabase側の再送を防ぐ）。
async function sendDmPushNotification(message) {
  if (!message?.meeting_id || !message?.sender_id) return { sent: 0 };

  const supabase = createAdminSupabaseClient();

  const { data: meeting } = await supabase
    .from("meetings")
    .select("id, user, mentor")
    .eq("id", message.meeting_id)
    .single();
  if (!meeting) return { sent: 0 };

  // 受信者の特定。送信者が参加者でない場合（想定外）は送らない
  let recipientId = null;
  let senderTable = null;
  if (message.sender_id === meeting.user) {
    recipientId = meeting.mentor;
    senderTable = "users";
  } else if (message.sender_id === meeting.mentor) {
    recipientId = meeting.user;
    senderTable = "mentors";
  }
  if (!recipientId) return { sent: 0 };

  const [{ data: sender }, { data: subscriptions }] = await Promise.all([
    supabase.from(senderTable).select("name").eq("id", message.sender_id).single(),
    supabase.from("push_subscriptions").select("*").eq("user_id", recipientId),
  ]);

  if (!subscriptions || subscriptions.length === 0) return { sent: 0 };

  webpush.setVapidDetails(
    "mailto:support@jaorium.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );

  const payload = JSON.stringify(
    buildPushPayload({
      senderName: sender?.name ?? "相手",
      message,
      meetingId: meeting.id,
    }),
  );

  let sent = 0;
  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
        );
        sent++;
      } catch (err) {
        // 端末変更などで死んだ購読は掃除する
        if (err.statusCode === 404 || err.statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        } else {
          console.error("web-push error:", err.statusCode, err.message);
        }
      }
    }),
  );

  return { sent };
}

export async function POST(req) {
  const secret = req.headers.get("x-webhook-secret");
  if (!isAuthorizedWebhookRequest(secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const table = body.table;

  switch (table) {
    case "mentors":
      revalidateTag("mentors");
      return NextResponse.json({ revalidated: true });
    case "messages": {
      if (body.type !== "INSERT") break;
      const { sent } = await sendDmPushNotification(body.record);
      return NextResponse.json({ pushed: sent });
    }
  }

  return NextResponse.json({ ok: true });
}
