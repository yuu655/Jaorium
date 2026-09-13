import MentorDashboardShell from "@/components/dashboard/mentor/MentorDashboardShell";
import MentorAvailabilityContent from "@/components/dashboard/mentor/MentorAvailabilityContent";
import { createClient } from "@/lib/supabase/server";
import {
  AVAILABILITY_MONTH_RANGE,
  groupBookedByDate,
  shiftMonth,
  todayInJst,
} from "@/lib/schedule";
import { getMentorDashboardData } from "../mentorDashboardData";

export default async function MentorAvailabilityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // profile/meetingsは /dashboard/mentor と同じキャッシュを共有する
  const { profile, meetings } = await getMentorDashboardData(
    supabase,
    user.id,
  )();

  // 面談可能日時はキャッシュに載せない（保存直後に古い値が出るのを避ける）。
  // 「前月の設定を読み込む」で前月分を逆算するため、前月1日から3ヶ月先までを取る。
  const currentMonth = todayInJst().slice(0, 7);
  const { data: availability } = await supabase
    .from("mentor_availabilities")
    .select("date, start_time, end_time")
    .eq("mentor_id", user.id)
    .gte("date", `${shiftMonth(currentMonth, -1)}-01`)
    .lt("date", `${shiftMonth(currentMonth, AVAILABILITY_MONTH_RANGE)}-01`)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  // 確定済みの面談と重なる枠は空き時間として出せないので、その日時を渡す
  const bookedByDate = groupBookedByDate(
    meetings.next.filter((m) => m.is_commit),
  );

  return (
    <MentorDashboardShell profile={profile} meetings={meetings} side="availability">
      <MentorAvailabilityContent
        initialAvailability={availability ?? []}
        bookedByDate={bookedByDate}
      />
    </MentorDashboardShell>
  );
}
