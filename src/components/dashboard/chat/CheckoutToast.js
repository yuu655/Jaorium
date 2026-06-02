"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CheckoutToast({ success, canceled }) {
  const router = useRouter();

  useEffect(() => {
    if (!success && !canceled) return;

    // URLからクエリパラメータを消す
    router.replace(window.location.pathname, { scroll: false });
  }, []);

  if (!success && !canceled) return null;

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all
      ${success ? "bg-green-600 text-white" : "bg-gray-700 text-white"}`}>
      {success ? (
        <><CheckCircle size={15} /> クレジットを購入しました。ボタンを押して確定してください。</>
      ) : (
        <><X size={15} /> 購入をキャンセルしました。</>
      )}
    </div>
  );
}