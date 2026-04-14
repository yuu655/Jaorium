import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Chat from "@/components/dashboard/chat/Chat";

export default async function ChatPage({ params }) {
  const { meetingId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: meeting } = await supabase
    .from("meetings")
    .select("*")
    .eq("id", meetingId)
    .single();

  if (!meeting || (meeting.user !== user.id && meeting.mentor !== user.id)) {
    redirect("/dashboard/user");
  }

  const isMentor = meeting.mentor === user.id;
  const counterpartId = isMentor ? meeting.user : meeting.mentor;
  const counterpartTable = isMentor ? "users" : "mentors";

  const { data: counterpart } = await supabase
    .from(counterpartTable)
    .select("*")
    .eq("id", counterpartId)
    .single();

  const { data: initialMessages } = await supabase
    .from("messages")
    .select("*")
    .eq("meeting_id", meetingId)
    .order("created_at", { ascending: true });

  return (
    <Chat
      meeting={meeting}
      currentUserId={user.id}
      counterpart={counterpart}
      initialMessages={initialMessages ?? []}
      isMentor={isMentor}
    />
  );
}
