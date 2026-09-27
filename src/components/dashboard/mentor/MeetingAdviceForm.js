"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileText } from "lucide-react";
import { saveMeetingAdvice } from "@/app/(userPage)/dashboard/mentor/advice/[meetingId]/actions";
import {
  ADVICE_ITEM_MAX_LENGTH,
  ADVICE_MAX_ITEMS,
} from "@/lib/validation/meetingAdviceSchema";

function toSlots(items) {
  return Array.from({ length: ADVICE_MAX_ITEMS }, (_, i) => items[i] ?? "");
}

export default function MeetingAdviceForm({ meetingId, initialItems = [], disabled = false }) {
  const router = useRouter();
  const [slots, setSlots] = useState(() => toSlots(initialItems));
  const [saving, setSaving] = useState(false);

  const handleChange = (index, value) => {
    setSlots((prev) => prev.map((v, i) => (i === index ? value : v)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const result = await saveMeetingAdvice(meetingId, slots);

    if (result?.error) {
      setSaving(false);
      toast.error(result.error);
      return;
    }
    // 保存したらチャットへ進む（メンターは入力が済むまでチャットを開けない）。
    // 遷移完了までボタンは押せないままにしておく
    toast.success("アドバイスを保存しました。");
    router.push(`/dashboard/chat/${meetingId}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {slots.map((value, i) => (
        <div key={i} className="flex items-start gap-3">
          <span className="mt-3 w-3.5 h-3.5 bg-blue-700 shrink-0" aria-hidden />
          <div className="flex-1">
            <textarea
              value={value}
              onChange={(e) => handleChange(i, e.target.value)}
              maxLength={ADVICE_ITEM_MAX_LENGTH}
              rows={2}
              disabled={disabled || saving}
              placeholder={`アドバイス${i + 1}`}
              aria-label={`アドバイス${i + 1}`}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
            <p className="text-right text-xs text-gray-400">
              {value.length} / {ADVICE_ITEM_MAX_LENGTH}
            </p>
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between gap-3 flex-wrap pt-2">
        {/* <a
          href={`/api/meeting-slide/${meetingId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
        >
          <FileText size={16} />
          面談資料をプレビュー
        </a> */}
        {!disabled && (
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "保存中..." : "保存してチャットへ"}
          </button>
        )}
      </div>
      <p className="text-xs text-gray-500">
        プレビューには保存済みの内容が反映されます。空欄の項目は保存時に詰められます（1つ以上の入力が必要です）。
      </p>
    </form>
  );
}
