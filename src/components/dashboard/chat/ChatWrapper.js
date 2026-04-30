"use client";

import dynamic from "next/dynamic";

const Chat = dynamic(() => import("./Chat"), { ssr: false });

export default function ChatWrapper({ meeting, meeting_schedule, currentUserId, counterpart, initialMessages, isMentor }) {
  return <Chat 
    meeting={meeting}
    meeting_schedule={meeting_schedule}
    currentUserId={currentUserId}
    counterpart={counterpart}
    initialMessages={initialMessages}
    isMentor={isMentor}
  />;
}