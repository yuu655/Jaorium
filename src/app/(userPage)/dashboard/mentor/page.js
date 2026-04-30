import MentorDashboard from "@/components/dashboard/mentor/MentorDashboard";
import { createClient } from "@/lib/supabase/server";
import { unstable_cache } from "next/cache";

export default async function MentorPage({ searchParams }) {
  const { side } = await searchParams;
  // console.log(side);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // supabaseとuserIdをキャッシュの外で取得してから渡す
  const getCachedData = (userId) =>
    unstable_cache(
      async () => {
        const [{ data: profile }, { data: Meetings }] = await Promise.all([
          supabase.from("mentors").select("*").eq("id", userId).single(),
          supabase.from("meetings").select("*").eq("mentor", userId),
        ]);
        // const allMeetings = [...(nextMeetings ?? []), ...(pastMeetings ?? [])];
        const userIds = [...new Set(Meetings.map((m) => m.user))];
        const { data: users } =
          userIds.length > 0
            ? await supabase
                .from("users")
                .select("id, name, grade, icon")
                .in("id", userIds)
            : { data: [] };

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

        const nextMeetings = merged_meetings.filter(item => !item.is_finished)
        const pastMeetings = merged_meetings.filter(item => item.is_finished)

        return {
          profile,
          meetings: { next: nextMeetings ?? [], past: pastMeetings ?? [] },
          users: users ?? [],
        };
      },
      [`dashboard-mentor-${userId}`], // userIdは引数から取得
      { revalidate: 3600, tags: [`dashboard-mentor-${userId}`, "meetings"] },
    );

  const getTags = (userId) =>
    unstable_cache(
      async () => {
        const [{ data: allTags }, { data: mentorTag_ids }] = await Promise.all([
          supabase.from("tags").select("*"),
          supabase.from("mentor_tags").select("*").eq("mentor_id", userId),
        ]);
        if (mentorTag_ids === null) return [];
        const mentorTagIds = mentorTag_ids.map((t) => t.tag_id);
        const mentorTags = allTags.filter((tag) =>
          mentorTagIds.includes(tag.id),
        );
        // console.log(mentorTags);
        return { allTags, mentorTags };
      },
      [`mentor-tags-${userId}`],
      { revalidate: 3600, tags: [`mentor-tags-${userId}`] },
    );

  const { profile, meetings, users } = await getCachedData(user.id)();
  // console.log(profile);
  const { allTags, mentorTags } = await getTags(user.id)();
  // console.log(meetings);
  // console.log(meetings)

  return (
    <MentorDashboard
      profile={profile}
      meetings={meetings}
      users={users}
      mentorTags={mentorTags}
      allTags={allTags}
      initialSide={side}
    />
  );
}
