"use client";

import { useMemo, useState } from "react";
import { X, ChevronLeft, ChevronRight, Plus, Info, Clock } from "lucide-react";
import {
  FREE_SLOT_END,
  MEETING_DURATION_MIN,
  TIME_PRESETS,
  expandRange,
  freeSlotOptions,
  isFutureSlot,
  mergeSlots,
  nowInJst,
  overlapsBookedSlot,
  toMinutes,
} from "@/lib/schedule";

// 月単位タブ（1日分）と曜日タブ（毎週◯曜）の両方で使う時間入力モーダル。
// 粗い操作（プリセット）→ 中くらい（開始〜終了）→ 細かい（30分グリッド）の順に並べる。
export default function AvailabilityTimeModal({
  title,
  subtitle,
  initialSlots = [],
  // 日付を渡すと「過ぎた時間」「確定済みの面談と重なる時間」を選べなくする
  date = null,
  bookedTimes = [],
  now = null,
  onSave,
  onClose,
  onPrev = null,
  onNext = null,
}) {
  const [slots, setSlots] = useState(() => [...initialSlots].sort());
  const [rangeStart, setRangeStart] = useState("13:00");
  const [rangeEnd, setRangeEnd] = useState("17:00");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [showGrid, setShowGrid] = useState(false);

  const clock = useMemo(() => now ?? nowInJst(), [now]);

  const slotOptions = freeSlotOptions();
  const endOptions = [...slotOptions.slice(1), FREE_SLOT_END];

  const dirty = slots.join(",") !== [...initialSlots].sort().join(",");
  const bands = mergeSlots(slots);

  const isDisabledSlot = (slot) => {
    if (!date) return false;
    return overlapsBookedSlot(slot, bookedTimes) || !isFutureSlot(date, slot, clock);
  };

  const addSlots = (added) => {
    setError(null);
    // 選べない時間は無視する（プリセットや帯の追加でまとめて入るため）
    const usable = added.filter((slot) => !isDisabledSlot(slot));
    setSlots((prev) => [...new Set([...prev, ...usable])].sort());
  };

  const removeBand = (band) => {
    const removed = new Set(expandRange(band.start_time, band.end_time));
    setSlots((prev) => prev.filter((slot) => !removed.has(slot)));
  };

  const toggleSlot = (slot) => {
    setError(null);
    setSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot].sort(),
    );
  };

  // 保存してから次の操作へ進む。未保存のまま日を移動して消えるのを防ぐ。
  const runWithSave = async (after) => {
    if (busy) return;
    if (!dirty) {
      after();
      return;
    }

    setBusy(true);
    const result = await onSave(slots);
    setBusy(false);

    if (result?.error) {
      setError(result.error);
      return;
    }
    after();
  };

  const rangeInvalid = toMinutes(rangeEnd) <= toMinutes(rangeStart);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center sm:px-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        {/* ヘッダー（前後移動つき） */}
        <div className="flex items-center gap-2 px-5 py-4 border-b sticky top-0 bg-white">
          {onPrev && (
            <button
              onClick={() => runWithSave(onPrev)}
              disabled={busy}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30"
              aria-label="前の日"
            >
              <ChevronLeft size={18} />
            </button>
          )}

          <div className="flex-1 text-center min-w-0">
            <p className="font-bold text-gray-800 truncate">{title}</p>
            {subtitle && <p className="text-xs text-gray-400 truncate">{subtitle}</p>}
          </div>

          {onNext && (
            <button
              onClick={() => runWithSave(onNext)}
              disabled={busy}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30"
              aria-label="次の日"
            >
              <ChevronRight size={18} />
            </button>
          )}

          <button
            onClick={() => runWithSave(onClose)}
            disabled={busy}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30"
            aria-label="閉じる"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* プリセット */}
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2">よく使う時間帯</p>
            <div className="grid grid-cols-2 gap-2">
              {TIME_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => addSlots(expandRange(preset.start, preset.end))}
                  className="py-2.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  {preset.label}
                  <span className="text-xs text-gray-400 ml-1.5">
                    {preset.start}-{preset.end}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 開始〜終了で追加 */}
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2">時間帯を指定して追加</p>
            <div className="flex items-center gap-2">
              <select
                value={rangeStart}
                onChange={(e) => setRangeStart(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {slotOptions.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
              <span className="text-gray-400 text-sm shrink-0">〜</span>
              <select
                value={rangeEnd}
                onChange={(e) => setRangeEnd(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {endOptions.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
              <button
                onClick={() => addSlots(expandRange(rangeStart, rangeEnd))}
                disabled={rangeInvalid}
                className="shrink-0 flex items-center gap-1 px-3 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
              >
                <Plus size={14} />
                追加
              </button>
            </div>
            {rangeInvalid && (
              <p className="text-xs text-red-600 mt-1.5">終了は開始より後にしてください</p>
            )}
          </div>

          {/* 設定中の帯 */}
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2">設定中</p>
            {bands.length === 0 ? (
              <p className="text-sm text-gray-400 bg-gray-50 rounded-lg px-4 py-3">
                空きなし（この{date ? "日" : "曜日"}は面談を受け付けません）
              </p>
            ) : (
              <div className="space-y-2">
                {bands.map((band) => (
                  <div
                    key={band.start_time}
                    className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-gray-800">
                      <Clock size={14} className="text-blue-500" />
                      {band.start_time} - {band.end_time}
                    </span>
                    <button
                      onClick={() => removeBand(band)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                      aria-label={`${band.start_time}からの時間帯を削除`}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 30分単位の微調整 */}
          <div>
            <button
              onClick={() => setShowGrid((v) => !v)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {showGrid ? "▾" : "▸"} 30分単位で調整する
            </button>

            {showGrid && (
              <div className="grid grid-cols-4 gap-2 mt-3">
                {slotOptions.map((slot) => {
                  const selected = slots.includes(slot);
                  const disabled = isDisabledSlot(slot);
                  const booked = date ? overlapsBookedSlot(slot, bookedTimes) : false;

                  return (
                    <button
                      key={slot}
                      onClick={() => toggleSlot(slot)}
                      disabled={disabled}
                      title={
                        booked
                          ? "確定済みの面談と重なっています"
                          : disabled
                            ? "すでに過ぎた時間です"
                            : undefined
                      }
                      className={`py-2 rounded-lg text-xs font-medium border transition-colors ${
                        disabled
                          ? `bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed ${booked ? "line-through" : ""}`
                          : selected
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <p className="flex items-center gap-1.5 text-xs text-gray-400">
            <Info size={12} className="shrink-0" />
            面談は{MEETING_DURATION_MIN}分です。選んだ時刻が開始時刻になります。
          </p>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        {/* フッター */}
        <div className="flex items-center gap-3 px-5 py-4 border-t sticky bottom-0 bg-white">
          <button
            onClick={() => setSlots([])}
            disabled={busy || slots.length === 0}
            className="px-4 py-2.5 text-sm text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-40"
          >
            クリア
          </button>
          <button
            onClick={() => runWithSave(onClose)}
            disabled={busy}
            className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
          >
            {busy ? "保存中..." : "保存する"}
          </button>
        </div>
      </div>
    </div>
  );
}
