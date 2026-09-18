import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import webpush from "web-push";
import { Resend } from "resend";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { escapeHtml } from "@/lib/escapeHtml";
import { formatProposalLines, parseProposals } from "@/lib/schedule";
import { shouldSendDmEmail } from "@/lib/dmNotification";
import getUrls from "@/utils/getUrls";

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

// DMの宛先（面談参加者のうち送信者でない方）と送信者名を引く。
// Web Pushとメールで同じ結果を使うので、webhook 1回につき1度だけ呼ぶ。
async function resolveDmRecipient(supabase, message) {
  if (!message?.meeting_id || !message?.sender_id) return null;

  const { data: meeting } = await supabase
    .from("meetings")
    .select("id, user, mentor")
    .eq("id", message.meeting_id)
    .single();
  if (!meeting) return null;

  // 送信者が参加者でない場合（想定外）は送らない
  let recipientId = null;
  let senderTable = null;
  if (message.sender_id === meeting.user) {
    recipientId = meeting.mentor;
    senderTable = "users";
  } else if (message.sender_id === meeting.mentor) {
    recipientId = meeting.user;
    senderTable = "mentors";
  }
  if (!recipientId) return null;

  const { data: sender } = await supabase
    .from(senderTable)
    .select("name")
    .eq("id", message.sender_id)
    .single();

  return { meeting, recipientId, senderName: sender?.name ?? "相手" };
}

// DMの受信者へWeb Pushを送る。
// 通知は補助機能なので、失敗してもwebhook自体は200で返す（Supabase側の再送を防ぐ）。
async function sendDmPushNotification(supabase, { message, meeting, recipientId, senderName }) {
  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", recipientId);

  if (!subscriptions || subscriptions.length === 0) return { sent: 0 };

  webpush.setVapidDetails(
    "mailto:support@jaorium.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );

  const payload = JSON.stringify(
    buildPushPayload({ senderName, message, meetingId: meeting.id }),
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

// メール本文。日時提案は希望を箇条書きにし、通常のメッセージは本文をそのまま載せる。
function buildDmEmailHtml({ senderName, message, meetingId }) {
  const link = `${getUrls()}/dashboard/chat/${meetingId}`;
  const heading = `<p>${escapeHtml(senderName)}さんからメッセージが届きました。</p>`;

  const body =
    message.type === "date_proposal"
      ? `<p>希望日時:</p><ul>${formatProposalLines(parseProposals(message.content))
          .map((line) => `<li>${escapeHtml(line)}</li>`)
          .join("")}</ul>`
      : `<p style="white-space:pre-wrap">${escapeHtml(message.content ?? "")}</p>`;

  return `${heading}${body}<p><a href='${link}'>メッセージ画面を開く</a></p>`;
}

// 受信者のメールアドレスは users/mentors テーブルにないのでAuthから引く
async function fetchUserEmail(supabase, userId) {
  const { data } = await supabase.auth.admin.getUserById(userId);
  return data?.user?.email ?? null;
}

// 既読時刻と最後に通知した時刻。行がなければ「一度も開いていない・送っていない」
async function fetchMeetingRead(supabase, { meetingId, userId }) {
  const { data } = await supabase
    .from("meeting_reads")
    .select("last_read_at, last_notified_at")
    .eq("meeting_id", meetingId)
    .eq("user_id", userId)
    .maybeSingle();
  return data ?? {};
}

async function markNotified(supabase, { meetingId, userId }) {
  return supabase
    .from("meeting_reads")
    .upsert(
      { meeting_id: meetingId, user_id: userId, last_notified_at: new Date().toISOString() },
      { onConflict: "meeting_id,user_id" },
    );
}

async function sendDmEmailNotification(supabase, { message, meeting, recipientId, senderName }) {
  // 相手が読んでいる、または直近に送ったばかりなら送らない
  const { last_read_at, last_notified_at } = await fetchMeetingRead(supabase, {
    meetingId: meeting.id,
    userId: recipientId,
  });

  const { send, reason } = shouldSendDmEmail({
    lastReadAt: last_read_at,
    lastNotifiedAt: last_notified_at,
    messageCreatedAt: message.created_at,
  });
  if (!send) return { mailed: false, reason };

  const to = await fetchUserEmail(supabase, recipientId);
  if (!to) return { mailed: false, reason: "no_email" };

  const resend = new Resend(process.env.SMTP_API_KEY);
  await resend.emails.send({
    from: "noreply@jaorium.com",
    to,
    subject:
      message.type === "date_proposal"
        ? `${senderName}さんから日時の提案が届きました`
        : `${senderName}さんからメッセージが届きました`,
    html: buildDmEmailHtml({ senderName, message, meetingId: meeting.id }),
  });

  // 送れたときだけスロットルの起点を進める（失敗時は次のメッセージで再挑戦できる）
  const { error } = await markNotified(supabase, { meetingId: meeting.id, userId: recipientId });
  if (error) console.error("markNotified failed:", error);

  return { mailed: true, reason: "sent" };
}

// Web Pushとメールは互いに独立した補助通知なので、片方が落ちても
// もう片方は送る。webhook自体は必ず200で返す（Supabase側の再送を防ぐ）。
async function notifyDmRecipient(message) {
  const supabase = createAdminSupabaseClient();
  const target = await resolveDmRecipient(supabase, message);
  if (!target) return { sent: 0, mailed: false };

  const [push, email] = await Promise.allSettled([
    sendDmPushNotification(supabase, { message, ...target }),
    sendDmEmailNotification(supabase, { message, ...target }),
  ]);

  if (push.status === "rejected") console.error("dm push failed:", push.reason);
  if (email.status === "rejected") console.error("dm email failed:", email.reason);

  return {
    sent: push.status === "fulfilled" ? push.value.sent : 0,
    mailed: email.status === "fulfilled" ? email.value.mailed : false,
  };
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
      const { sent, mailed } = await notifyDmRecipient(body.record);
      return NextResponse.json({ pushed: sent, mailed });
    }
  }

  return NextResponse.json({ ok: true });
}
