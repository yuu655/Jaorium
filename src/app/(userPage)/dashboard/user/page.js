import UserDashboard from "@/components/dashboard/user/UserDashboard";
import { createClient } from "@/lib/supabase/server";
import { unstable_cache } from "next/cache";

export default async function UserPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const getCachedData = (supabase, userId) =>
    unstable_cache(
      async () => {
        const [
          { data: profile },
          { data: mentors },
          { data: mentor_admin_allow },
          { data: Meetings },
        ] = await Promise.all([
          supabase.from("users").select("*").eq("id", userId).single(),
          supabase.from("mentors").select("*").eq("is_allowed", true),
          supabase.from("mentor_secret").select("*").eq("admin_allow", true),
          supabase.from("meetings").select("*").eq("user", userId),
        ]);

      const mentor_admin_allow_list = mentor_admin_allow.map(item => item.id);
      const public_admin_allowed_mentor = mentors.filter(item => mentor_admin_allow_list.includes(item.id));

        const { data: meeting_sc } = await supabase
          .from("meeting_schedules")
          .select("*")
          .in(
            "meeting_id",
            Meetings.map((item) => item.id),
          );

        const normalized_meeting_sc = meeting_sc.map((item) => ({
          id: item.meeting_id,
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

        const nextMeetings = merged_meetings.filter(
          (item) => !item.is_finished,
        );
        const pastMeetings = merged_meetings.filter((item) => item.is_finished);

        return {
          profile,
          mentors: public_admin_allowed_mentor ?? [],
          meetings: { next: nextMeetings ?? [], past: pastMeetings ?? [] },
        };
      },
      [`dashboard-user-${userId}`],
      { revalidate: 60, tags: [`dashboard-user-${userId}`, "meetings"] },
    );

  const { profile, mentors, meetings } = await getCachedData(
    supabase,
    user.id,
  )();

  return (
    <UserDashboard profile={profile} meetings={meetings} mentors={mentors} />
  );
}
