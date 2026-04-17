"use server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";
import { Resend } from "resend";
const resend = new Resend(process.env.SMTP_API_KEY);

export const submitBooking = async (mentorId, prevState, formData) => {
  const title = formData.get("title");
  const description = formData.get("description");
  const troubleEpisode = formData.get("trouble_episode");
  const actionsTaken = formData.get("actions_taken");
  const unresolvedIssues = formData.get("unresolved_issues");
  const desiredOutcome = formData.get("desired_outcome");

  if (!title) return { error: "相談内容を選択してください" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "user") return { error: "権限がありません" };

  const { data: mentor } = await supabase
    .from("mentors")
    .select("id")
    .eq("id", mentorId)
    .single();
  if (!mentor) return { error: "メンターが存在しません" };

  const { data: mentorData } = await supabase.auth.admin.getUserById(mentorId);
  const mentorEmail = mentorData.user?.email;
  console.log(mentor.id, mentorId, mentorData, mentorEmail);

  const { data: meetingData, error } = await supabase.from("meetings").insert({
    title,
    description,
    mentor: mentorId,
    user: user.id,
    trouble_episode: troubleEpisode,
    actions_taken: actionsTaken,
    unresolved_issues: unresolvedIssues,
    desired_outcome: desiredOutcome,
  }).select();

  if (error) return { error: "予約の作成に失敗しました" };

  // await resend.emails.send({
  //   from: "noreply@jaorium.com",
  //   to: mentorEmail,
  //   subject: "新しい相談が入りました",
  //   html: `<a href='https://www.jaorium.com/dashboard/chat/${meetingData[0].id}'>新しい相談</a><p>が入りました。</p><p>相談内容: ` + title + `</p><p>詳細: ` + description + `</p>`,
  // });
  // await resend.emails.send({
  //   from: "noreply@jaorium.com",
  //   to: user.email,
  //   subject: "相談を送信しました",
  //   html: "<p>相談を送信しました。</p><p>相談内容: " + title + "</p><p>詳細: " + description + `</p><p><a href='https://www.jaorium.com/dashboard/chat/${meetingData[0].id}'>メッセージ画面</a>から面談日時を相談してください${mentorData}</p>`,
  // });

  revalidateTag(`dashboard-user-${user.id}`);
  revalidateTag(`dashboard-mentor-${mentorId}`);
  redirect("/dashboard/user");
};