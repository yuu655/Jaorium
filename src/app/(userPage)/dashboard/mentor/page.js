"use server";
import MentorDashboard from "@/components/dashboard/mentor/MentorDashboard";
import { createClient } from "@/lib/supabase/server";
import { getMentorDashboardData, getMentorTags } from "./mentorDashboardData";

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
    />
  );
}
