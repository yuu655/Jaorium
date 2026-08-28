"use server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";
import { Resend } from "resend";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import getUrls from "@/utils/getUrls";

const resend = new Resend(process.env.SMTP_API_KEY);

function parseBookingForm(formData) {
  return {
    title: formData.get("title"),
    description: formData.get("description"),
    troubleEpisode: formData.get("trouble_episode"),
    actionsTaken: formData.get("actions_taken"),
    unresolvedIssues: formData.get("unresolved_issues"),
    desiredOutcome: formData.get("desired_outcome"),
  };
}

// roleはmiddleware(proxy.js)と同じくprofilesテーブルを正とする。
// user_metadata.roleは現行のOTPサインアップフローでは設定されず、nullのままになる。
async function fetchCallerRole(supabase, userId) {
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  return data?.role;
}

function buildMeetingRecord({ mentorId, userId, form }) {
  return {
    title: form.title,
    description: form.description,
    mentor: mentorId,
    user: userId,
    trouble_episode: form.troubleEpisode,
    actions_taken: form.actionsTaken,
    unresolved_issues: form.unresolvedIssues,
    desired_outcome: form.desiredOutcome,
  };
}

// mentorsではなくpublic_mentorsビューを引く。mentorsを直接見ると存在確認しかできず、
// admin_allow=false（未承認）やis_allowed=false（停止中）のメンターのIDを直接POSTすれば
// 予約が成立してしまう。公開条件の判定はビュー側に一本化する。
async function fetchMentorById(supabase, mentorId) {
  const { data } = await supabase.from("public_mentors").select("id").eq("id", mentorId).single();
  return data;
}

async function fetchMentorContact(masterSupabase, mentorId) {
  const { data } = await masterSupabase.auth.admin.getUserById(mentorId);
  return data;
}

async function insertMeeting(supabase, record) {
  return supabase.from("meetings").insert(record).select();
}

async function sendMentorNotificationEmail({ to, meetingId, title, description }) {
  return resend.emails.send({
    from: "noreply@jaorium.com",
    to,
    subject: "新しい相談が入りました",
    html:
      `<a href='${getUrls()}/dashboard/chat/${meetingId}'>新しい相談</a><p>が入りました。</p><p>相談内容: ` +
      title +
      `</p><p>詳細: ` +
      description +
      `</p>`,
  });
}

async function sendUserConfirmationEmail({ to, meetingId, title, description, mentorData }) {
  return resend.emails.send({
    from: "noreply@jaorium.com",
    to,
    subject: "相談を送信しました",
    html:
      "<p>相談を送信しました。</p><p>相談内容: " +
      title +
      "</p><p>詳細: " +
      description +
      `</p><p><a href='${getUrls()}/dashboard/chat/${meetingId}'>メッセージ画面</a>から面談日時を相談してください${mentorData}</p>`,
  });
}

export const submitBooking = async (mentorId, prevState, formData) => {
  const form = parseBookingForm(formData);
  if (!form.title) return { error: "相談内容を選択してください" };

  const supabase = await createClient();
  const masterSupabase = createAdminSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };
  if ((await fetchCallerRole(supabase, user.id)) !== "user") return { error: "権限がありません" };

  const mentor = await fetchMentorById(supabase, mentorId);
  if (!mentor) return { error: "メンターが存在しません" };

  const mentorData = await fetchMentorContact(masterSupabase, mentorId);
  const mentorEmail = mentorData.user?.email;

  const { data: meetingData, error } = await insertMeeting(
    supabase,
    buildMeetingRecord({ mentorId, userId: user.id, form }),
  );

  if (error) return { error: "予約の作成に失敗しました" };

  const meetingId = meetingData[0].id;

  await sendMentorNotificationEmail({
    to: mentorEmail,
    meetingId,
    title: form.title,
    description: form.description,
  });
  await sendUserConfirmationEmail({
    to: user.email,
    meetingId,
    title: form.title,
    description: form.description,
    mentorData,
  });

  revalidateTag(`dashboard-user-${user.id}`);
  revalidateTag(`dashboard-mentor-${mentorId}`);
  redirect(`/dashboard/chat/${meetingId}`);
};
