"use client";
import {
  LiveKitRoom,
  useParticipants,
  useLocalParticipant,
  useTrackMutedIndicator,
  VideoTrack,
  AudioTrack,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";
import { useState, useEffect, useCallback } from "react";
import { redirect } from "next/navigation";
import getUrls from "@/utils/getUrls";

// ── ParticipantTile ──────────────────────────────────────
// 各タイルが自分自身の状態をフックで購読する
function ParticipantTile({ participant, isLocal, isSpeaking, compact = false }) {
  const { isMuted } = useTrackMutedIndicator({
    participant,
    source: Track.Source.Microphone,
  });

  const cameraPub = participant.getTrackPublication(Track.Source.Camera);
  const hasVideo = !!cameraPub?.track && !cameraPub.isMuted;

  const initials = (participant.name || participant.identity || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={`relative rounded-xl overflow-hidden bg-gray-900 transition-all duration-300
        ${isSpeaking ? "ring-2 ring-blue-400" : "ring-1 ring-white/10"}`}
      style={{ aspectRatio: "16/9" }}
    >
      {hasVideo && (
        <VideoTrack
          participant={participant}
          source={Track.Source.Camera}
          className="w-full h-full object-cover"
        />
      )}

      {/* 自分以外の音声 */}
      {!isLocal && (
        <AudioTrack participant={participant} source={Track.Source.Microphone} />
      )}

      {/* カメラOFF時アバター */}
      {!hasVideo && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800">
          <div className={`rounded-full bg-blue-500/20 flex items-center justify-center font-medium text-blue-300
            ${compact ? "w-10 h-10 text-sm" : "w-16 h-16 text-2xl"}`}>
            {initials}
          </div>
          {!compact && (
            <p className="text-white/70 text-sm mt-3">
              {participant.name || participant.identity}
            </p>
          )}
        </div>
      )}

      {/* 名前バッジ */}
      <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm rounded-md px-2 py-0.5 text-white text-xs">
        {participant.name || participant.identity}
        {isLocal && <span className="ml-1 text-white/50">(あなた)</span>}
      </div>

      {/* ミュートアイコン */}
      {isMuted && (
        <div className="absolute bottom-2 right-2 bg-red-500/80 rounded-full w-6 h-6 flex items-center justify-center">
          <MicOffIcon />
        </div>
      )}

      {/* 発言中 */}
      {isSpeaking && !isMuted && (
        <div className="absolute bottom-2 right-2 bg-blue-500/80 rounded-full w-6 h-6 flex items-center justify-center">
          <MicOnIcon />
        </div>
      )}
    </div>
  );
}

// ── RoomContent ──────────────────────────────────────────
function RoomContent({ onLeave }) {
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();
  const participants = useParticipants();
  const [speakingMap, setSpeakingMap] = useState({});
  const [elapsed, setElapsed] = useState(0);

  // ミュート・カメラはLiveKitがソースオブトゥルース
  const isMuted = !isMicrophoneEnabled;
  const isCameraOff = !isCameraEnabled;

  // 画面共有の状態もLiveKitから直接取得
  const allPubs = [...participants, localParticipant]
    .flatMap((p) => [...p.trackPublications.values()]);
  const screenSharePub = allPubs.find(
    (pub) => pub.source === Track.Source.ScreenShare && pub.track
  );
  const isScreenShareActive = !!screenSharePub;

  // 自分が共有中かどうか
  const myScreenSharePub = localParticipant.getTrackPublication(Track.Source.ScreenShare);
  const isScreenSharing = !!myScreenSharePub?.track;

  // iOSはgetDisplayMedia非対応
  const isScreenShareSupported = typeof navigator !== "undefined"
    && !!navigator.mediaDevices?.getDisplayMedia;

  // タイマー
  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  // 発言検出
  useEffect(() => {
    const allParticipants = [localParticipant, ...participants];
    const handlers = allParticipants.map((p) => {
      const handler = (speaking) => {
        setSpeakingMap((prev) => ({ ...prev, [p.identity]: speaking }));
      };
      p.on("isSpeakingChanged", handler);
      return { p, handler };
    });
    return () => handlers.forEach(({ p, handler }) => p.off("isSpeakingChanged", handler));
  }, [localParticipant, participants]);

  // コントロール — stateは触らずLiveKitに委ねる
  const toggleMute = useCallback(async () => {
    await localParticipant.setMicrophoneEnabled(isMuted);
  }, [localParticipant, isMuted]);

  const toggleCamera = useCallback(async () => {
    await localParticipant.setCameraEnabled(isCameraOff);
  }, [localParticipant, isCameraOff]);

  const toggleScreenShare = useCallback(async () => {
    try {
      await localParticipant.setScreenShareEnabled(!isScreenSharing);
      // stateは触らない。LiveKitがトラックを変更 → useLocalParticipantが再レンダリング
    } catch (err) {
      // キャンセルされてもLiveKit側が変化しないのでUIも変わらない
      console.error("Screen share cancelled:", err);
    }
  }, [localParticipant, isScreenSharing]);

  const allParticipants = [
    localParticipant,
    ...participants.filter((p) => p.identity !== localParticipant.identity),
  ];

  const gridCols =
    allParticipants.length === 1 ? "grid-cols-1 max-w-3xl mx-auto" :
    allParticipants.length <= 4  ? "grid-cols-2" :
                                   "grid-cols-3";

  return (
    <div className="fixed inset-0 bg-gray-950 flex flex-col overflow-hidden">
      {/* ビデオエリア */}
      <div className="flex-1 flex overflow-hidden p-3 gap-3 min-h-0">

        {isScreenShareActive ? (
          // 画面共有レイアウト：大きい共有画面 + 右サイドに参加者
          <>
            <div className="flex-1 bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center">
              <VideoTrack
                participant={screenSharePub.participant}
                source={Track.Source.ScreenShare}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col gap-2 w-44 overflow-y-auto">
              {allParticipants.map((p) => (
                <ParticipantTile
                  key={p.identity}
                  participant={p}
                  isLocal={p.identity === localParticipant.identity}
                  isSpeaking={!!speakingMap[p.identity]}
                  compact
                />
              ))}
            </div>
          </>
        ) : (
          // 通常グリッドレイアウト
          <div className={`w-full grid gap-3 content-center ${gridCols}`}>
            {allParticipants.map((p) => (
              <ParticipantTile
                key={p.identity}
                participant={p}
                isLocal={p.identity === localParticipant.identity}
                isSpeaking={!!speakingMap[p.identity]}
              />
            ))}
          </div>
        )}
      </div>

      {/* コントロールバー */}
      <div className="flex-none bg-gray-900/80 backdrop-blur-sm border-t border-white/10 px-6 py-3 flex items-center justify-between">
        <span className="text-white/50 text-sm tabular-nums w-16">{formatTime(elapsed)}</span>

        <div className="flex items-center gap-2">
          <ControlButton
            onClick={toggleMute}
            active={isMuted}
            activeClass="bg-red-500/20 text-red-400 hover:bg-red-500/30"
            icon={isMuted ? <MicOffIcon /> : <MicOnIcon />}
            label={isMuted ? "ミュート中" : "ミュート"}
          />
          <ControlButton
            onClick={toggleCamera}
            active={isCameraOff}
            activeClass="bg-red-500/20 text-red-400 hover:bg-red-500/30"
            icon={isCameraOff ? <CameraOffIcon /> : <CameraOnIcon />}
            label={isCameraOff ? "カメラOFF" : "カメラ"}
          />
          {isScreenShareSupported && (
            <ControlButton
              onClick={toggleScreenShare}
              active={isScreenSharing}
              activeClass="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
              icon={<ScreenShareIcon />}
              label={isScreenSharing ? "共有中" : "画面共有"}
            />
          )}
          <button
            onClick={onLeave}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
          >
            <PhoneOffIcon />
            退出
          </button>
        </div>

        <span className="text-white/50 text-sm w-16 text-right">
          {allParticipants.length}人参加中
        </span>
      </div>
    </div>
  );
}

// ── ControlButton ────────────────────────────────────────
function ControlButton({ onClick, active, activeClass, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors
        ${active ? activeClass : "bg-white/10 text-white hover:bg-white/20"}`}
    >
      {icon}
      {label}
    </button>
  );
}

// ── アイコン ─────────────────────────────────────────────
const MicOnIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
  </svg>
);
const MicOffIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <line x1="1" y1="1" x2="23" y2="23" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23M12 19v4M8 23h8" />
  </svg>
);
const CameraOnIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
  </svg>
);
const CameraOffIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <line x1="1" y1="1" x2="23" y2="23" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21H3a2 2 0 01-2-2V8a2 2 0 012-2h3m3-3h6l2 3h1a2 2 0 012 2v9.34" />
  </svg>
);
const ScreenShareIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8M12 17v4M9 10l3-3 3 3M12 7v6" />
  </svg>
);
const PhoneOffIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 2h6v6M10 14L21 3M5 5a16 16 0 0014 14l3-3-4-4-3 3A10 10 0 018 8L5 5z" />
  </svg>
);

// ── エントリポイント ─────────────────────────────────────
export default function Interview({ roomName, userName }) {
  const [token, setToken] = useState("");
  const [joined, setJoined] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState("idle");
  const [permissionError, setPermissionError] = useState("");

  useEffect(() => {
    fetch(`/api/livekit-token?roomName=${roomName}&userName=${userName}`)
      .then((r) => r.json())
      .then((data) => setToken(data.token));
  }, [roomName, userName]);

  const requestMediaPermissions = async () => {
    setPermissionStatus("checking");
    setPermissionError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      stream.getTracks().forEach((t) => t.stop());
      setPermissionStatus("granted");
    } catch (err) {
      setPermissionStatus("denied");
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setPermissionError("マイク・カメラへのアクセスが拒否されました。\niOSの設定 > アプリ名 > マイク・カメラ をオンにしてください。");
      } else if (err.name === "NotFoundError") {
        setPermissionError("マイクまたはカメラが見つかりませんでした。");
      } else {
        setPermissionError(`エラーが発生しました: ${err.message}`);
      }
    }
  };

  if (!token) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <p className="text-gray-400 animate-pulse">接続中...</p>
      </div>
    );
  }

  if (joined) {
    return (
      <LiveKitRoom
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        token={token}
        connect={true}
        video={true}
        audio={true}
        onDisconnected={() => redirect(`${getUrls()}/dashboard/chat/${roomName}`)}
      >
        <RoomContent onLeave={() => redirect(`${getUrls()}/dashboard/chat/${roomName}`)} />
      </LiveKitRoom>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-8 w-full max-w-md text-center space-y-4">
        <h2 className="text-xl font-semibold text-white">面談を開始する前に</h2>

        {permissionStatus === "idle" && (
          <>
            <p className="text-gray-400">マイクとカメラへのアクセス許可が必要です。</p>
            <p className="text-sm text-gray-500">📱 iPadをお使いの場合、次の画面で「許可」を選択してください。</p>
            <button
              className="mt-2 w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
              onClick={requestMediaPermissions}
            >
              マイク・カメラを確認する
            </button>
          </>
        )}

        {permissionStatus === "checking" && (
          <p className="text-gray-400 animate-pulse">
            権限を確認中です。ポップアップが表示されたら「許可」を選択してください...
          </p>
        )}

        {permissionStatus === "granted" && (
          <>
            <p className="text-green-400 font-medium">✅ マイク・カメラの準備ができました</p>
            <button
              className="mt-2 w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
              onClick={() => setJoined(true)}
            >
              面談を開始する
            </button>
          </>
        )}

        {permissionStatus === "denied" && (
          <>
            <p className="text-red-400 text-sm whitespace-pre-line">{permissionError}</p>
            <details className="text-left bg-gray-800 border border-white/10 rounded-xl p-4 text-sm text-gray-300">
              <summary className="cursor-pointer font-medium text-white mb-2">設定の変更方法</summary>
              <ol className="mt-2 space-y-1 list-decimal list-inside text-gray-400">
                <li>iPhoneまたはiPadの「設定」アプリを開く</li>
                <li>使用しているブラウザアプリを選択</li>
                <li>「マイク」と「カメラ」をオンにする</li>
                <li>このページを再読み込みする</li>
              </ol>
            </details>
            <button
              className="mt-2 w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
              onClick={requestMediaPermissions}
            >
              もう一度試す
            </button>
          </>
        )}
      </div>
    </div>
  );
}