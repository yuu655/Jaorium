"use client";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles";
import { NextResponse } from "next/server";
import { useState, useEffect } from "react";
import { redirect } from "next/navigation";
import getUrls from "@/utils/getUrls";
export default function Interview({ roomName, userName }) {
  const [token, setToken] = useState("");
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    fetch(`/api/livekit-token?roomName=${roomName}&userName=${userName}`)
      .then((r) => r.json())
      .then((data) => setToken(data.token));
  }, [roomName, userName]);

  const AudioUnlocker = () => {
    const room = useRoomContext();

    useEffect(() => {
      // iPadのAudioContextをアンロック
      const unlock = () => room.startAudio();
      document.addEventListener("touchstart", unlock, { once: true });
      return () => document.removeEventListener("touchstart", unlock);
    }, [room]);

    return null;
  }

  if (!token) return <div>接続中...</div>;

  return joined ? (
    <LiveKitRoom
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      token={token}
      connect={true}
      video={true}
      audio={true}
      style={{ height: "100vh" }}
      onDisconnected={() => {
        redirect(`${getUrls()}/dashboard/chat/${roomName}`);
      }}
    >
      <AudioUnlocker />
      <VideoConference />
    </LiveKitRoom>
  ) : (
    <button onClick={() => setJoined(true)}>面談を開始する</button>
  );
}
