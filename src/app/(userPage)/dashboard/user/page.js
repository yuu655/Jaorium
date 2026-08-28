import UserDashboard from "@/components/dashboard/user/UserDashboard";
import { createClient } from "@/lib/supabase/server";
import { fetchMentorDirectory } from "@/lib/mentorDirectory";
import { unstable_cache } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function UserPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const getCachedData = (supabase, userId) =>
    unstable_cache(
      async () => {
        // mentor_secretはRLSで本人しか読めず、他ユーザーのセッションからは0行になる。
        // admin_allowでの絞り込みはpublic_mentorsビュー(公開カラムのみ)に任せる。
        const [
          { data: profile },
          { mentors, tags, mentorTagsMap },
          { data: Meetings },
        ] = await Promise.all([
          supabase.from("users").select("*").eq("id", userId).single(),
          fetchMentorDirectory(supabase),
          supabase.from("meetings").select("*").eq("user", userId).order("created_at", { ascending: false }),
        ]);

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
          mentors,
          meetings: { next: nextMeetings ?? [], past: pastMeetings ?? [] },
          mentorTagsMap,
          tags,
        };
      },
      [`dashboard-user-${userId}`],
      { revalidate: 60, tags: [`dashboard-user-${userId}`, "meetings"] },
    );

  const { profile, mentors, meetings, mentorTagsMap, tags } = await getCachedData(
    supabase,
    user.id,
  )();

  console.log(profile)
  console.log(mentors)
  console.log(meetings)
  console.log(mentorTagsMap)
  console.log(tags)

  return (
    <UserDashboard profile={profile} meetings={meetings} mentors={mentors} mentorTagsMap={mentorTagsMap} tags={tags} />
  );
}
