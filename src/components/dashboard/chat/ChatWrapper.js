"use client";

import dynamic from "next/dynamic";

const Chat = dynamic(() => import("./Chat"), { ssr: false });

export default function ChatWrapper({
  meeting,
  meeting_schedule,
  currentUserId,
  counterpart,
  initialMessages,
  isUser,
  availabilityByDate,
  bookedByDate,
  unrestricted,
  counterpartId,
  initialCounterpartReadAt,
}) {
  return <Chat
    meeting={meeting}
    meeting_schedule={meeting_schedule}
    currentUserId={currentUserId}
    counterpart={counterpart}
    initialMessages={initialMessages}
    isUser={isUser}
    availabilityByDate={availabilityByDate}
    bookedByDate={bookedByDate}
    unrestricted={unrestricted}
    counterpartId={counterpartId}
    initialCounterpartReadAt={initialCounterpartReadAt}
  />;
}
