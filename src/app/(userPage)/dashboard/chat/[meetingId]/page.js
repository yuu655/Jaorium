import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ChatWrapper from "@/components/dashboard/chat/ChatWrapper";
import Chat from "@/components/dashboard/chat/Chat";
import { counterpartColumnsFor } from "@/lib/chatCounterpart";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  groupBandsByDate,
  groupBookedByDate,
  hasFutureAvailability,
  todayInJst,
} from "@/lib/schedule";


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

  const today = todayInJst();

  // メンターの面談可能日時。RLS上、面談相手のユーザーも読める。
  const { data: availability } = await supabase
    .from("mentor_availabilities")
    .select("date, start_time, end_time")
    .eq("mentor_id", meeting.mentor)
    .gte("date", today);

  // このメンターが「別の面談」で確定済みの日時。他人の面談のscheduleはRLSで参照
  // できないため service role で引き、開始時刻だけをクライアントに渡す
  // （面談IDや相手の情報は渡さない）。
  const bookedByDate = await fetchMentorBookedSlots({
    mentorId: meeting.mentor,
    excludeMeetingId: meetingId,
    from: today,
  });

  // メンター本人は自分の予定を把握しているので制限しない。ユーザーは、これから先に
  // 使える枠が1つも残っていないとき（未設定・今日の分が過ぎただけ、を含む）だけ、
  // これまで通り自由に提案できる。
  const unrestricted = isMentor || !hasFutureAvailability(availability);

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
      availabilityByDate={groupBandsByDate(availability)}
      bookedByDate={bookedByDate}
      unrestricted={unrestricted}
    />
  );
}

// メンターが担当する他の面談のうち、確定済み・未終了のものの日時を集める
async function fetchMentorBookedSlots({ mentorId, excludeMeetingId, from }) {
  const admin = createAdminSupabaseClient();

  const { data: mentorMeetings } = await admin
    .from("meetings")
    .select("id")
    .eq("mentor", mentorId);

  const meetingIds = (mentorMeetings ?? [])
    .map((m) => m.id)
    .filter((id) => id !== excludeMeetingId);

  if (meetingIds.length === 0) return {};

  const { data: schedules } = await admin
    .from("meeting_schedules")
    .select("date, time")
    .in("meeting_id", meetingIds)
    .eq("is_commit", true)
    .eq("is_finished", false)
    .gte("date", from);

  return groupBookedByDate(schedules);
}
