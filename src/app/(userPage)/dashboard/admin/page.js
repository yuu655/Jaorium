import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminDashboard from "@/components/dashboard/admin/AdminDashboard";

export default async function UserPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if(profile.role !== "admin"){
    redirect("/dashboard")
  }
  const masterSupabase = createAdminSupabaseClient();

  // 支払い有無に関わらず、全ミーティングを対象にする
  const { data: Meetings } = await masterSupabase
    .from("meetings")
    .select("*")
    .order("created_at", { ascending: false });

  const meetingIds = Meetings.map((item) => item.id);

  const { data: meeting_sc } = await masterSupabase
    .from("meeting_schedules")
    .select("*")
    .in("meeting_id", meetingIds);

  // 支払い済み（クレジット消費済み）かどうかの判定用
  const { data: MeetingConfirmations } = await masterSupabase
    .from("meeting_confirmations")
    .select("meeting_id")
    .in("meeting_id", meetingIds);

  const paidMeetingIds = new Set(
    MeetingConfirmations.map((item) => item.meeting_id),
  );

  const normalized_meeting_sc = meeting_sc.map((item) => ({
    id: item?.meeting_id,
    ...item,
  }));

  const map = new Map();

  Meetings.forEach((item) => {
    map.set(item.id, { ...item });
  });

  normalized_meeting_sc.forEach((item) => {
    if (map.has(item.id)) {
      Object.assign(map.get(item.id), item);
    } else {
      map.set(item.id, { ...item });
    }
  });

  // 結果を配列に戻す
  const merged_meetings = Array.from(map.values());

  // user/mentorをまとめて取得してマージ（1件ずつのN+1を避ける）
  const userIds = [...new Set(merged_meetings.map((m) => m.user).filter(Boolean))];
  const mentorIds = [...new Set(merged_meetings.map((m) => m.mentor).filter(Boolean))];

  const [{ data: users }, { data: mentors }] = await Promise.all([
    masterSupabase.from("users").select("*").in("id", userIds),
    masterSupabase.from("mentors").select("*").in("id", mentorIds),
  ]);

  const userMap = new Map((users ?? []).map((u) => [u.id, u]));
  const mentorMap = new Map((mentors ?? []).map((m) => [m.id, m]));

  merged_meetings.forEach((meeting) => {
    meeting.user = userMap.get(meeting.user) ?? null;
    meeting.mentor = mentorMap.get(meeting.mentor) ?? null;
    meeting.is_paid = paidMeetingIds.has(meeting.id);
  });

  const nextMeetings = merged_meetings.filter((item) => !item.is_finished);
  const pastMeetings = merged_meetings.filter((item) => item.is_finished);

  // console.log(merged_meetings);

  return (
    <AdminDashboard meetings={nextMeetings}/>
  );
}
