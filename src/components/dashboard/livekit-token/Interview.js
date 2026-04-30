"use client";
import {
  LiveKitRoom,
  useParticipants,
  useLocalParticipant,
  VideoTrack,
  AudioTrack,
  useTrackMutedIndicator,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";
import { useState, useEffect, useCallback } from "react";
import { redirect } from "next/navigation";
import getUrls from "@/utils/getUrls";
import { useSlideShare } from "./useSlideShare";
import { SlideViewer } from "./SlideViewer";

// ── 個別タイル ──────────────────────────────────────────
function ParticipantTile({ participant, isLocal, isSpeaking, compact = false }) {
  const { isMuted } = useTrackMutedIndicator({
    participant,
    source: Track.Source.Microphone,
  });

  const cameraPub = participant.getTrackPublication(Track.Source.Camera);
  const hasVideo = !!cameraPub?.track && !cameraPub.isMuted;
  const videoTrackRef = { participant, publication: cameraPub, source: Track.Source.Camera };
  const micPub = participant.getTrackPublication(Track.Source.Microphone);
  const audioTrackRef = { participant, publication: micPub, source: Track.Source.Microphone };

  const initials = (participant.name || participant.identity || "?")
    .split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div
      className={`relative rounded-xl overflow-hidden bg-gray-900 transition-all duration-300
        ${isSpeaking ? "ring-2 ring-blue-400" : "ring-1 ring-white/10"}
        ${compact ? "aspect-video" : ""}`}
      style={!compact ? { aspectRatio: "16/9" } : {}}
    >
      {hasVideo && (
        <VideoTrack
          participant={participant}
          source={Track.Source.Camera}
          trackRef={videoTrackRef}
          className="w-full h-full object-cover"
        />
      )}

      {!isLocal && (
        <AudioTrack
          participant={participant}
          source={Track.Source.Microphone}
          trackRef={audioTrackRef}
        />
      )}

      {!hasVideo && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800">
          <div className={`rounded-full bg-blue-500/20 flex items-center justify-center font-medium text-blue-300
            ${compact ? "w-10 h-10 text-lg" : "w-16 h-16 text-2xl"}`}>
            {initials}
          </div>
          {!compact && (
            <p className="text-white/70 text-sm mt-3">
              {participant.name || participant.identity}
            </p>
          )}
        </div>
      )}

      <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm rounded-md px-2 py-0.5 text-white text-xs">
        {participant.name || participant.identity}
        {isLocal && <span className="ml-1 text-white/50">(あなた)</span>}
      </div>

      {isMuted && (
        <div className="absolute bottom-2 right-2 bg-red-500/80 rounded-full w-6 h-6 flex items-center justify-center">
          <MicOffIcon />
        </div>
      )}
      {isSpeaking && !isMuted && (
        <div className="absolute bottom-2 right-2 bg-blue-500/80 rounded-full w-6 h-6 flex items-center justify-center">
          <MicOnIcon />
        </div>
      )}
    </div>
  );
}

// ── メインのルーム内UI ───────────────────────────────────
function RoomContent({ onLeave }) {
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();
  const participants = useParticipants();
  const [speakingMap, setSpeakingMap] = useState({});
  const [elapsed, setElapsed] = useState(0);
  const [showSlidePanel, setShowSlidePanel] = useState(false);

  // スライド共有フック
  const {
    slides,
    currentPage,
    isPresenting,
    isLocalPresenter,
    startPresentation,
    stopPresentation,
    goToPage,
  } = useSlideShare();

  // スライド発表開始時は自動でパネルを開く
  useEffect(() => {
    if (isPresenting) setShowSlidePanel(true);
  }, [isPresenting]);

  const isMuted = !isMicrophoneEnabled;
  const isCameraOff = !isCameraEnabled;

  // 画面共有（PC向け）
  const myScreenSharePub = localParticipant.getTrackPublication(Track.Source.ScreenShare);
  const isScreenSharing = !!myScreenSharePub?.track;
  const isScreenShareSupported =
    typeof navigator !== "undefined" && !!navigator.mediaDevices?.getDisplayMedia;

  const allPubs = [...participants, localParticipant].flatMap((p) => [...p.trackPublications.values()]);
  const screenSharePub = allPubs.find((pub) => pub.source === Track.Source.ScreenShare && pub.track);
  const isScreenShareActive = !!screenSharePub;
  const screenShareTrackRef = {
    participant: screenSharePub?.participant,
    publication: screenSharePub,
    source: Track.Source.ScreenShare,
  };

  const toggleScreenShare = useCallback(async () => {
    try {
      await localParticipant.setScreenShareEnabled(!isScreenSharing);
    } catch (err) {
      console.error("Screen share cancelled:", err);
    }
  }, [localParticipant, isScreenSharing]);

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
    const allP = [localParticipant, ...participants.filter((p) => p !== localParticipant)];
    const handlers = allP.map((p) => {
      const handler = (speaking) =>
        setSpeakingMap((prev) => ({ ...prev, [p.identity]: speaking }));
      p.on("isSpeakingChanged", handler);
      return { p, handler };
    });
    return () => handlers.forEach(({ p, handler }) => p.off("isSpeakingChanged", handler));
  }, [localParticipant, participants]);

  const toggleMute = () => localParticipant.setMicrophoneEnabled(isMuted);
  const toggleCamera = () => localParticipant.setCameraEnabled(isCameraOff);

  const allParticipants = [
    localParticipant,
    ...participants.filter((p) => p.identity !== localParticipant.identity),
  ];
  const count = allParticipants.length;

  // ── スライドパネルが開いているときのレイアウト ───────
  const isSlideMode = showSlidePanel;

  // グリッド設定（スライドなし時）
  const gridCols = count === 1 ? "grid-cols-1" : count <= 4 ? "grid-cols-2" : "grid-cols-3";
  const gridMaxW = count === 1 ? "max-w-3xl" : "max-w-full";

  return (
    <div className="fixed inset-0 bg-gray-950 flex flex-col overflow-hidden">
      {/* メインエリア */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── スライドモード ── */}
        {isSlideMode ? (
          <>
            {/* スライドエリア（左/上） */}
            <div className="flex-1 flex flex-col p-3 overflow-hidden min-w-0">
              <SlideViewer
                slides={slides}
                currentPage={currentPage}
                isLocalPresenter={isLocalPresenter}
                isPresenting={isPresenting}
                onPageChange={goToPage}
                onStop={() => { stopPresentation(); setShowSlidePanel(false); }}
                onUpload={startPresentation}
              />
            </div>

            {/* 参加者サイドバー（右） */}
            <div className="flex-none w-44 flex flex-col gap-2 p-3 overflow-y-auto border-l border-white/10">
              {/* 画面共有がある場合はそちらも表示 */}
              {isScreenShareActive && (
                <div className="rounded-xl overflow-hidden bg-gray-900 ring-1 ring-white/10" style={{ aspectRatio: "16/9" }}>
                  <VideoTrack
                    participant={screenSharePub.participant}
                    source={Track.Source.ScreenShare}
                    trackRef={screenShareTrackRef}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
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
          /* ── 通常モード（画面共有 or グリッド）── */
          <div className="flex-1 flex items-center justify-center p-4">
            {isScreenShareActive ? (
              <div className="flex w-full h-full gap-3">
                <div className="flex-1 bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center">
                  <VideoTrack
                    participant={screenSharePub.participant}
                    source={Track.Source.ScreenShare}
                    trackRef={screenShareTrackRef}
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
              </div>
            ) : (
              <div className={`w-full ${gridMaxW} grid ${gridCols} gap-3`}>
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
        )}
      </div>

      {/* ── コントロールバー ── */}
      <div className="flex-none bg-gray-900/80 backdrop-blur-sm border-t border-white/10 px-4 py-3 flex items-center justify-between gap-2">
        <span className="text-white/50 text-sm tabular-nums w-14">{formatTime(elapsed)}</span>

        <div className="flex items-center gap-2 flex-wrap justify-center">
          {/* マイク */}
          <button
            onClick={toggleMute}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors
              ${isMuted ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-white/10 text-white hover:bg-white/20"}`}
          >
            {isMuted ? <MicOffIcon /> : <MicOnIcon />}
            <span className="hidden sm:inline">{isMuted ? "ミュート中" : "ミュート"}</span>
          </button>

          {/* カメラ */}
          <button
            onClick={toggleCamera}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors
              ${isCameraOff ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-white/10 text-white hover:bg-white/20"}`}
          >
            {isCameraOff ? <CameraOffIcon /> : <CameraOnIcon />}
            <span className="hidden sm:inline">{isCameraOff ? "カメラOFF" : "カメラ"}</span>
          </button>

          {/* 資料共有（常に表示）*/}
          <button
            onClick={() => setShowSlidePanel((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors
              ${showSlidePanel
                ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                : "bg-white/10 text-white hover:bg-white/20"}`}
          >
            <PresentationIcon className="w-4 h-4" />
            <span className="hidden sm:inline">
              {isPresenting ? "資料共有中" : "資料共有"}
            </span>
            {isPresenting && (
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            )}
          </button>

          {/* 画面共有（PC のみ表示）*/}
          {/* {isScreenShareSupported && (
            <button
              onClick={toggleScreenShare}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors
                ${isScreenSharing
                  ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                  : "bg-white/10 text-white hover:bg-white/20"}`}
            >
              <ScreenShareIcon />
              <span className="hidden sm:inline">{isScreenSharing ? "共有中" : "画面共有"}</span>
            </button>
          )} */}

          {/* 退出 */}
          <button
            onClick={onLeave}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
          >
            <PhoneOffIcon />
            <span className="hidden sm:inline">退出</span>
          </button>
        </div>

        <span className="text-white/50 text-sm w-14 text-right">{count}人</span>
      </div>
    </div>
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
const PhoneOffIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 2h6v6M10 14L21 3M5 5a16 16 0 0014 14l3-3-4-4-3 3A10 10 0 018 8L5 5z" />
  </svg>
);
const ScreenShareIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8M12 17v4M9 10l3-3 3 3M12 7v6" />
  </svg>
);
const PresentationIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3h16.5M3.75 3v11.25A2.25 2.25 0 006 16.5h12a2.25 2.25 0 002.25-2.25V3M3.75 3H2.25M20.25 3h1.5M9 20.25l3-3 3 3M12 17.25V21" />
  </svg>
);

const formatDate = (date) => {
  if (!date) return null;
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}/${month}/${day} ${hours}:${minutes}`;
};

// ── エントリポイント ─────────────────────────────────────
export default function Interview({ roomName, userName, dateTime }) {
  const [token, setToken] = useState("");
  const [joined, setJoined] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState("idle");
  const [permissionError, setPermissionError] = useState("");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    fetch(`/api/livekit-token?roomName=${roomName}&userName=${userName}`)
      .then((r) => r.json())
      .then((data) => setToken(data.token));
  }, [roomName, userName]);

  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => clearInterval(id);
  }, []);

  const isAfter = dateTime ? now > dateTime : false;
  // console.log(isAfter, now, dateTime)


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
        setPermissionError(
          "マイク・カメラへのアクセスが拒否されました。\niOSの設定 > アプリ名 > マイク・カメラ をオンにしてください。"
        );
      } else if (err.name === "NotFoundError") {
        setPermissionError("マイクまたはカメラが見つかりませんでした。");
      } else {
        setPermissionError(`エラーが発生しました: ${err.message}`);
      }
    }
  };

  if(!isAfter){
    return(
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <p className="text-gray-400 animate-pulse">{formatDate(dateTime)}</p>
        <p className="text-gray-400 animate-pulse">開始時間までお待ちください</p>
      </div>
    )
  }

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
            <p className="text-sm text-gray-500">
              📱 iPadをお使いの場合、次の画面で「許可」を選択してください。
            </p>
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
