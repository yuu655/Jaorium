import InterviewWrapper from "@/components/dashboard/livekit-token/interviewWrapper";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export default async function InterviewPage({ params }) {
  const { roomName } = await params;
  const supabase = await createClient();

  const masterSupabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_SECRET_KEY,
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();


  const { data: meeting } =
    profile.role === "admin"
      ? await masterSupabase
          .from("meeting_schedules")
          .select("*")
          .eq("meeting_id", roomName)
          .single()
      : await supabase
          .from("meeting_schedules")
          .select("*")
          .eq("meeting_id", roomName)
          .single();
  const dateTime = new Date(`${meeting.date}T${meeting.time}:00+09:00`);
  // console.log(dateTime)

  return (
    <>
      <InterviewWrapper
        roomName={roomName}
        userName={user.id}
        dateTime={dateTime}
      />
    </>
  );
}
