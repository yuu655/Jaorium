import InterviewWrapper from "@/components/dashboard/livekit-token/interviewWrapper";
import { createClient } from "@/lib/supabase/server";

export default async function InterviewPage({ params }) {
  const { roomName } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: meeting } = await supabase
    .from("meetings")
    .select("*")
    .eq("id", roomName)
    .single();
  

  
  
  return (
    <>
      <InterviewWrapper roomName={roomName} userName={user.id} />
    </>
  );
}
