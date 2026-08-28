import UserDashboard from "@/components/dashboard/user/UserDashboard";
import { createClient } from "@/lib/supabase/server";
import { unstable_cache } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

const hasIcon = (mentor) => Boolean(mentor?.icon);

export default async function UserPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const fetchMentorTags = async (mentorId) => {
    const { data } = await supabase
      .from("mentor_tags")
      .select("tag_id")
      .eq("mentor_id", mentorId);
    return data;
  };

  const getCachedData = (supabase, userId) =>
    unstable_cache(
      async () => {
        // mentor_secretはRLSで本人しか読めず、他ユーザーのセッションからは0行になる。
        // admin_allowでの絞り込みはpublic_mentorsビュー(公開カラムのみ)に任せる。
        const [
          { data: profile },
          { data: mentors },
          { data: Meetings },
          { data: tags },
        ] = await Promise.all([
          supabase.from("users").select("*").eq("id", userId).single(),
          supabase.from("public_mentors").select("*"),
          supabase.from("meetings").select("*").eq("user", userId).order("created_at", { ascending: false }),
          supabase.from("tags").select("*"),
        ]);

        const mentorTagsMap = Object.fromEntries(
          await Promise.all(
            mentors.map(async (mentor) => [
              mentor.id,
              await fetchMentorTags(mentor.id),
            ]),
          ),
        );

        await Promise.all(
          mentors.map(async (mentor) => {
            const { data: review_sum } = await supabase
              .from("review_sum")
              .select("star_avg")
              .eq("mentor_id", mentor.id)
              .single();
            mentor.review_sum = review_sum?.star_avg || 0;
          }),
        );

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

        console.log(merged_meetings)

        // アイコンを設定しているメンターを先に表示する(同条件内の順序は元のまま)。
        const sortedMentors = [...(mentors ?? [])].sort(
          (a, b) => hasIcon(b) - hasIcon(a),
        );

        return {
          profile,
          mentors: sortedMentors,
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
