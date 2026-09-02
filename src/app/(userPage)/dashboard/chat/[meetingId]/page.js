import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ChatWrapper from "@/components/dashboard/chat/ChatWrapper";
import Chat from "@/components/dashboard/chat/Chat";
import { counterpartColumnsFor } from "@/lib/chatCounterpart";


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
  
  const { data: meeting_schedule } = await supabase
    .from("meeting_schedules")
    .select("*")
    .eq("meeting_id", meetingId)
    .single();

  // console.log(meeting_schedule)

  if (!meeting || (meeting.user !== user.id && meeting.mentor !== user.id)) {
    redirect("/dashboard/user");
  }

  const isMentor = meeting.mentor === user.id;
  const counterpartId = isMentor ? meeting.user : meeting.mentor;
  const counterpartTable = isMentor ? "users" : "mentors";

  // 相手のプロフィールは必要な列だけに絞る（customer_id 等の機密列を渡さない）
  const { data: counterpart } = await supabase
    .from(counterpartTable)
    .select(counterpartColumnsFor(counterpartTable))
    .eq("id", counterpartId)
    .single();

  const { data: initialMessages } = await supabase
    .from("messages")
    .select("*")
    .eq("meeting_id", meetingId)
    .order("created_at", { ascending: true });

  // 論理削除されたメッセージは本文をクライアントに渡さない（表示は「削除しました」のみ）
  const visibleMessages = (initialMessages ?? []).map((msg) =>
    msg.deleted_at ? { ...msg, content: "" } : msg,
  );

  return (
    <ChatWrapper
      meeting={meeting}
      meeting_schedule={meeting_schedule}
      currentUserId={user.id}
      counterpart={counterpart}
      initialMessages={visibleMessages}
      isUser={!isMentor}
    />
  );
}
