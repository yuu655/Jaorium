"use server";
import MentorDashboard from "@/components/dashboard/mentor/MentorDashboard";
import { createClient } from "@/lib/supabase/server";
import { getMentorDashboardData, getMentorTags } from "./mentorDashboardData";
import { fetchUnreadByMeeting } from "@/lib/unreadMessages";

export default async function MentorPage({ searchParams }) {
  const { side } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { profile, meetings, users } = await getMentorDashboardData(
    supabase,
    user.id,
  )();
  const { allTags, mentorTags } = await getMentorTags(supabase, user.id)();

  // 未読は変化が速いのでキャッシュの外で引く（開いたのにバッジが残るのを防ぐ）
  const unreadByMeeting = await fetchUnreadByMeeting(supabase, {
    userId: user.id,
    meetingIds: meetings.next.map((m) => m.id),
  });

  // アドバイス入力済みの面談。入力直後にダッシュボードへ戻ったとき反映されるようキャッシュの外で引く
  const nextMeetingIds = meetings.next.map((m) => m.id);
  const { data: advices } =
    nextMeetingIds.length > 0
      ? await supabase
          .from("meeting_advices")
          .select("meeting_id, items")
          .in("meeting_id", nextMeetingIds)
      : { data: [] };
  const advisedMeetingIds = (advices ?? [])
    .filter((a) => a.items?.length > 0)
    .map((a) => a.meeting_id);

  // 面談可能日時の取得（キャッシュなしの重いクエリ）は
  // /dashboard/mentor/availability 側に移したので、ここでは読まない。
  return (
    <MentorDashboard
      profile={profile}
      meetings={meetings}
      users={users}
      mentorTags={mentorTags}
      allTags={allTags}
      initialSide={side}
      unreadByMeeting={unreadByMeeting}
      advisedMeetingIds={advisedMeetingIds}
    />
  );
}
