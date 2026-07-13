import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminChatViewer from "@/components/dashboard/admin/AdminChatViewer";
import { counterpartColumnsFor } from "@/lib/chatCounterpart";

export default async function AdminChatPage({ params }) {
  const { meetingId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // middlewareは /dashboard/admin（完全一致）しかガードしないため、
  // サブパスであるこのページでも必ずロールを確認する
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const masterSupabase = createAdminSupabaseClient();

  const { data: meeting } = await masterSupabase
    .from("meetings")
    .select("*")
    .eq("id", meetingId)
    .single();

  if (!meeting) redirect("/dashboard/admin");

  const [
    { data: meetingSchedule },
    { data: meetingUser },
    { data: mentor },
    { data: messages },
  ] = await Promise.all([
    masterSupabase
      .from("meeting_schedules")
      .select("*")
      .eq("meeting_id", meetingId)
      .single(),
    masterSupabase
      .from("users")
      .select(counterpartColumnsFor("users"))
      .eq("id", meeting.user)
      .single(),
    masterSupabase
      .from("mentors")
      .select(counterpartColumnsFor("mentors"))
      .eq("id", meeting.mentor)
      .single(),
    masterSupabase
      .from("messages")
      .select("*")
      .eq("meeting_id", meetingId)
      .order("created_at", { ascending: true }),
  ]);

  return (
    <AdminChatViewer
      meeting={meeting}
      meetingSchedule={meetingSchedule}
      user={meetingUser}
      mentor={mentor}
      messages={messages ?? []}
    />
  );
}
