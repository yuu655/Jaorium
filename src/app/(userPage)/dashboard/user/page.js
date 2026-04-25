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
          { data: nextMeetings },
          { data: pastMeetings },
        ] = await Promise.all([
          supabase.from("users").select("*").eq("id", userId).single(),
          supabase
            .from("mentors")
            .select("*"),
          supabase
            .from("meetings")
            .select("*")
            .eq("user", userId)
            .eq("is_finished", false),
          supabase
            .from("meetings")
            .select("*")
            .eq("user", userId)
            .eq("is_finished", true),
        ]);

        return {
          profile,
          mentors: mentors ?? [],
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
  
  console.log(meetings);

  return (
    <UserDashboard profile={profile} meetings={meetings} mentors={mentors} />
  );
}
