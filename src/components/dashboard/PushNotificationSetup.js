"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// VAPID公開鍵(base64url)をPushManager.subscribeが要求するUint8Arrayに変換
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

async function subscribeAndSave() {
  const registration = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    ),
  });

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const json = subscription.toJSON();
  await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    },
    { onConflict: "endpoint" },
  );
}

// DMのプッシュ通知を有効化するバナー。
// - 未対応ブラウザ・拒否済みでは何も表示しない
// - 許可済みなら購読情報を黙って再同期する（端末側で購読が更新されるため）
// - 未決(default)の場合のみバナーを出し、ボタン押下（ユーザー操作起点）で許可を求める
export default function PushNotificationSetup() {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      return;
    }

    if (Notification.permission === "granted") {
      subscribeAndSave().catch((err) =>
        console.error("push resubscribe error:", err),
      );
    } else if (Notification.permission === "default") {
      if (sessionStorage.getItem("push-banner-dismissed") !== "1") {
        setShow(true);
      }
    }
  }, []);

  const enable = async () => {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        await subscribeAndSave();
      }
    } catch (err) {
      console.error("push subscribe error:", err);
    } finally {
      setBusy(false);
      setShow(false);
    }
  };

  const dismiss = () => {
    sessionStorage.setItem("push-banner-dismissed", "1");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <p className="text-sm text-blue-800 flex items-center gap-1.5 min-w-0">
          <Bell size={14} className="shrink-0" />
          <span className="truncate">
            メッセージが届いたときにプッシュ通知を受け取れます
          </span>
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={enable}
            disabled={busy}
            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300"
          >
            {busy ? "設定中..." : "通知を有効にする"}
          </button>
          <button
            onClick={dismiss}
            className="text-blue-400 hover:text-blue-600 transition-colors"
            title="閉じる"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
