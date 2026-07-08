import InterviewWrapper from "@/components/dashboard/livekit-token/interviewWrapper";
import { createClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

// 参加資格・支払いの最終的な強制は /api/livekit-token 側で行う。
// このページのチェックはUX用（未払いなら購入導線のあるチャットへ戻す）。
export default async function InterviewPage({ params }) {
  const { roomName } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const isAdmin = profile?.role === "admin";

  if (!isAdmin) {
    // 参加者確認（RLSにより参加していない面談は取得できない）
    const { data: meeting } = await supabase
      .from("meetings")
      .select("id, user, mentor")
      .eq("id", roomName)
      .maybeSingle();

    if (!meeting || (meeting.user !== user.id && meeting.mentor !== user.id)) {
      redirect("/dashboard");
    }

    // 支払い（クレジット消費）確認。未払いなら購入導線のあるチャットへ
    const { data: confirmation } = await supabase
      .from("meeting_confirmations")
      .select("id")
      .eq("meeting_id", roomName)
      .maybeSingle();

    if (!confirmation) {
      redirect(`/dashboard/chat/${roomName}`);
    }
  }

  // adminはRLS外から参照するためservice roleを使用
  const scheduleClient = isAdmin ? createAdminSupabaseClient() : supabase;
  const { data: schedule } = await scheduleClient
    .from("meeting_schedules")
    .select("*")
    .eq("meeting_id", roomName)
    .maybeSingle();

  // 日程未確定のまま直接URLで来た場合はチャットへ戻す
  if (!schedule?.is_commit || !schedule.date || !schedule.time) {
    redirect(`/dashboard/chat/${roomName}`);
  }

  const dateTime = new Date(`${schedule.date}T${schedule.time}:00+09:00`);

  return (
    <InterviewWrapper
      roomName={roomName}
      userName={user.id}
      userRole={profile?.role}
      dateTime={dateTime}
    />
  );
}
