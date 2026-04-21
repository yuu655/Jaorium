import InterviewWrapper from "@/components/dashboard/livekit-token/interviewWrapper";
import { createClient } from "@/lib/supabase/server";

export default async function InterviewPage({ params }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const { roomName } = await params;
  return (
    <>
      <InterviewWrapper roomName={roomName} userName={user.id} />
    </>
  );
}
