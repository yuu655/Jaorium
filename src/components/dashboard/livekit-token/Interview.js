"use client";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles";
import { useState, useEffect } from "react";
import { redirect } from "next/navigation";
import getUrls from "@/utils/getUrls";

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
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      stream.getTracks().forEach((track) => track.stop());
      setPermissionStatus("granted");
    } catch (err) {
      console.error("Permission error:", err);

      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        setPermissionStatus("denied");
        setPermissionError(
          "マイク・カメラへのアクセスが拒否されました。\niOSの設定 > アプリ名 > マイク・カメラ をオンにしてください。",
        );
      } else if (err.name === "NotFoundError") {
        setPermissionStatus("denied");
        setPermissionError("マイクまたはカメラが見つかりませんでした。");
      } else {
        setPermissionStatus("denied");
        setPermissionError(`エラーが発生しました: ${err.message}`);
      }
    }
  };

  if (!token) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500 text-lg animate-pulse">接続中...</p>
      </div>
    );
  }

  if (joined) {
    return (
      <div className="fixed inset-0 overflow-hidden">
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
          <VideoConference />
        </LiveKitRoom>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-md text-center space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">
          面談を開始する前に
        </h2>

        {permissionStatus === "idle" && (
          <>
            <p className="text-gray-600">
              マイクとカメラへのアクセス許可が必要です。
            </p>
            <p className="text-sm text-gray-400">
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
          <p className="text-gray-500 animate-pulse">
            権限を確認中です。ブラウザのポップアップが表示されたら「許可」を選択してください...
          </p>
        )}

        {permissionStatus === "granted" && (
          <>
            <p className="text-green-600 font-semibold">
              ✅ マイク・カメラの準備ができました
            </p>
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
            <p className="text-red-500 whitespace-pre-line text-sm">
              {permissionError}
            </p>

            <details className="text-left bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-700">
              <summary className="cursor-pointer font-medium text-gray-800 mb-2">
                設定の変更方法
              </summary>
              <ol className="mt-2 space-y-1 list-decimal list-inside">
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
