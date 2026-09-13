"use client";

import { useState } from "react";
import { CalendarRange, ChevronLeft, ChevronRight, Copy, X } from "lucide-react";
import {
  datesOfWeekdaysInMonth,
  datesOverwrittenByPattern,
  mergeSlots,
} from "@/lib/schedule";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// 曜日は月曜始まりで並べる（0=日 … 6=土）
const WEEKDAY_ROWS = [
  { value: 1, label: "月" },
  { value: 2, label: "火" },
  { value: 3, label: "水" },
  { value: 4, label: "木" },
  { value: 5, label: "金" },
  { value: 6, label: "土" },
  { value: 0, label: "日" },
];

function describeSlots(slots) {
  if (!slots) return null;
  if (slots.length === 0) return "空きなしにする";
  return mergeSlots(slots)
    .map((band) => `${band.start_time}-${band.end_time}`)
    .join(" / ");
}

export default function MentorWeeklyAvailability({
  month, // "2026-10"
  monthLabel, // "2026年10月"
  canGoPrev,
  canGoNext,
  onShiftMonth,
  slotsByWeekday,
  onEditWeekday,
  onRemoveWeekday,
  mixedWeekdays = {},
  bandsByDate,
  today,
  mode,
  onModeChange,
  onApply,
  applying,
  canLoadPreviousMonth,
  onLoadPreviousMonth,
  error,
}) {
  const [confirming, setConfirming] = useState(false);

  const targetDates = Object.keys(slotsByWeekday).flatMap((weekday) =>
    datesOfWeekdaysInMonth(month, [weekday], { from: today }),
  );

  // 置き換えのときだけ、個別に調整済みの日が潰れることを知らせる
  const overwritten =
    mode === "replace"
      ? datesOverwrittenByPattern({ month, slotsByWeekday, bandsByDate })
      : [];

  const hasTarget = Object.keys(slotsByWeekday).length > 0;

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-1">
        <CalendarRange size={20} className="text-blue-600" />
        <h2 className="font-bold text-lg">曜日から一括設定</h2>
      </div>
      <p className="text-sm text-gray-500 mb-5">
        曜日ごとに時間帯を決めて、表示中の月にまとめて反映します。
        反映後はカレンダーから日ごとに調整できます。
      </p>

      {/* 対象月 */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => onShiftMonth(-1)}
          disabled={!canGoPrev}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
          aria-label="前の月"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="text-sm text-gray-500">
          対象: <span className="font-bold text-gray-800">{monthLabel}</span>
        </p>
        <button
          onClick={() => onShiftMonth(1)}
          disabled={!canGoNext}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
          aria-label="次の月"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {canLoadPreviousMonth && (
        <button
          onClick={onLoadPreviousMonth}
          className="w-full mb-4 flex items-center justify-center gap-2 py-2.5 border border-blue-200 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors"
        >
          <Copy size={14} />
          前月の設定を読み込む
        </button>
      )}

      {/* 曜日ごとの時間帯 */}
      <div className="divide-y border rounded-lg mb-5">
        {WEEKDAY_ROWS.map(({ value, label }) => {
          const slots = slotsByWeekday[value];
          const description = describeSlots(slots);

          return (
            <div key={value} className="flex items-center gap-3 px-4 py-3">
              <span
                className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-sm font-bold ${
                  description ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"
                }`}
              >
                {label}
              </span>

              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm truncate ${
                    description ? "text-gray-800 font-medium" : "text-gray-400"
                  }`}
                >
                  {description ?? "未設定"}
                </p>
                {mixedWeekdays[value] && (
                  <p className="text-xs text-amber-600">現在は日によって異なります</p>
                )}
              </div>

              <button
                onClick={() => onEditWeekday(value)}
                className="shrink-0 px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
              >
                {description ? "変更" : "設定"}
              </button>

              {description && (
                <button
                  onClick={() => onRemoveWeekday(value)}
                  className="shrink-0 text-gray-300 hover:text-gray-600 transition-colors"
                  aria-label={`${label}曜日を対象から外す`}
                  title="対象から外す"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* 反映方法 */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-400 mb-2">反映方法</p>
        <div className="space-y-2">
          <label className="flex items-start gap-2.5 text-sm text-gray-700 cursor-pointer">
            <input
              type="radio"
              checked={mode === "replace"}
              onChange={() => onModeChange("replace")}
              className="mt-0.5"
            />
            <span>
              該当曜日を置き換える
              <span className="block text-xs text-gray-400">
                その曜日は、ここで設定した内容だけになります
              </span>
            </span>
          </label>
          <label className="flex items-start gap-2.5 text-sm text-gray-700 cursor-pointer">
            <input
              type="radio"
              checked={mode === "merge"}
              onChange={() => onModeChange("merge")}
              className="mt-0.5"
            />
            <span>
              既存の設定に追加する
              <span className="block text-xs text-gray-400">
                すでに入っている時間帯は残したまま足します
              </span>
            </span>
          </label>
        </div>
      </div>

      {/* 反映内容の予告 */}
      <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-600 mb-4">
        {hasTarget ? (
          <>
            <p>
              {monthLabel}の{" "}
              <strong className="text-gray-800">
                {WEEKDAY_ROWS.filter(({ value }) => slotsByWeekday[value] !== undefined)
                  .map(({ label }) => label)
                  .join("・")}
              </strong>{" "}
              計 <strong className="text-gray-800">{targetDates.length}</strong> 日分に反映されます
            </p>
            {overwritten.length > 0 && (
              <p className="text-amber-700 mt-1.5">
                うち {overwritten.length} 日（
                {overwritten
                  .slice(0, 3)
                  .map((date) => `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`)
                  .join("・")}
                {overwritten.length > 3 && " ほか"}
                ）は個別に調整済みです。上書きされます。
              </p>
            )}
          </>
        ) : (
          <p className="text-gray-400">
            時間帯を設定した曜日だけが反映されます。まずは曜日を設定してください。
          </p>
        )}
      </div>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <button
        onClick={() => setConfirming(true)}
        disabled={!hasTarget || applying || targetDates.length === 0}
        className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {applying ? "反映中..." : "この月に反映する"}
      </button>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{monthLabel}に反映しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              {targetDates.length}日分の面談可能日時を
              {mode === "replace" ? "置き換えます" : "追加します"}。
              {overwritten.length > 0 &&
                `個別に調整済みの ${overwritten.length} 日分も上書きされます。`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={onApply} className="bg-blue-600 hover:bg-blue-700">
              反映する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
