import { unstable_cache } from "next/cache";

// /dashboard/mentor と /dashboard/mentor/availability の両方が
// profile / meetings / users を必要とするので、キャッシュキーごと共有する。
// タグが同じなので2ルートから呼んでもDBアクセスは増えない。

// supabaseはunstable_cacheの外から渡す（クライアント自体はキャッシュに載せない）
export function getMentorDashboardData(supabase, userId) {
  return unstable_cache(
    async () => {
      const [{ data: mentorProfile }, { data: secret }, { data: Meetings }] = await Promise.all([
        supabase.from("mentors").select("*").eq("id", userId).single(),
        // Stripe連携状態は mentor_secret（本人SELECT可）から取得してマージする
        supabase.from("mentor_secret").select("stripe_account_id, stripe_onboarding_completed").eq("id", userId).single(),
        supabase.from("meetings").select("*").eq("mentor", userId).order("created_at", { ascending: false }),
      ]);
      const profile = { ...mentorProfile, ...(secret ?? {}) };

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

      const nextMeetings = merged_meetings.filter((item) => !item.is_finished);
      const pastMeetings = merged_meetings.filter((item) => item.is_finished);

      return {
        profile,
        meetings: { next: nextMeetings ?? [], past: pastMeetings ?? [] },
        users: users ?? [],
      };
    },
    [`dashboard-mentor-${userId}`],
    { revalidate: 3600, tags: [`dashboard-mentor-${userId}`, "meetings"] },
  );
}

// タグはプロフィールタブだけが使うので /dashboard/mentor 側でのみ呼ぶ
export function getMentorTags(supabase, userId) {
  return unstable_cache(
    async () => {
      const [{ data: allTags }, { data: mentorTag_ids }] = await Promise.all([
        supabase.from("tags").select("*"),
        supabase.from("mentor_tags").select("*").eq("mentor_id", userId),
      ]);
      if (mentorTag_ids === null) return { allTags: allTags ?? [], mentorTags: [] };
      const mentorTagIds = mentorTag_ids.map((t) => t.tag_id);
      const mentorTags = allTags.filter((tag) => mentorTagIds.includes(tag.id));
      return { allTags, mentorTags };
    },
    [`mentor-tags-${userId}`],
    { revalidate: 3600, tags: [`mentor-tags-${userId}`] },
  );
}
