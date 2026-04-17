"use client";

import dynamic from "next/dynamic";

const Chat = dynamic(() => import("./Chat"), { ssr: false });

export default function ChatWrapper(meeting, currentUserId, counterpart, initialMessages, isMentor) {
  return <Chat 
    meeting={meeting}
    currentUserId={currentUserId}
    counterpart={counterpart}
    initialMessages={initialMessages}
    isMentor={isMentor}
  />;
}