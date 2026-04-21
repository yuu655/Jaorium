"use client";

import dynamic from "next/dynamic";

const Interview = dynamic(
  () => import("@/components/dashboard/livekit-token/Interview"),
  {
    ssr: false, // LiveKitはブラウザ専用なのでSSR無効
  },
);

export default function InterviewWrapper({ roomName, userName }) {
  return (
    <Interview
      roomName={roomName}
      userName={userName} // Supabaseのセッションから取得するのが理想
    />
  );
}
