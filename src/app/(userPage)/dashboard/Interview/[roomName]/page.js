import InterviewWrapper from "@/components/dashboard/livekit-token/interviewWrapper";
import { createClient } from "@/lib/supabase/server";

export default async function InterviewPage({ params }) {
  const { roomName } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: meeting } = await supabase
    .from("meeting_schedules")
    .select("*")
    .eq("meeting_id", roomName)
    .single();
  const dateTime = new Date(`${meeting.date}T${meeting.time}:00+09:00`);
  // console.log(dateTime)

  
  return (
    <>
      <InterviewWrapper roomName={roomName} userName={user.id} dateTime={dateTime} />
    </>
  );
}
