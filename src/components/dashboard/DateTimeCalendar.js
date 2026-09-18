"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import { availableSlots, nowInJst, MEETING_DURATION_MIN } from "@/lib/schedule";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

// 選べるのは当月〜3ヶ月先（メンター側の登録範囲と揃える）
const MONTH_RANGE = 3;

function monthKey(year, month) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

function dateKey(year, month, day) {
  return `${monthKey(year, month)}-${String(day).padStart(2, "0")}`;
}

function buildCalendarCells(year, month) {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
}

// 日付＋時刻を1つ選ぶカレンダー（制御コンポーネント）。
// 値の持ち方は呼び出し側に任せるので、インラインでもダイアログの中でも使える。
// disabledSlotKeys には "YYYY-MM-DD|HH:MM" を入れると、その枠を選べなくする
// （他の希望で既に押さえている枠の重複防止）。
export default function DateTimeCalendar({
  value,
  onChange,
  availabilityByDate = {},
  bookedByDate = {},
  unrestricted = false,
  disabledSlotKeys,
}) {
  // 「今」は開いている間は固定でよい（過ぎた枠の判定に使う）
  const now = useMemo(() => nowInJst(), []);
  const today = now.date;

  const date = value?.date ?? "";
  const time = value?.time ?? "";

  // 既に選んである希望の月を最初に出す（選び直しのとき迷わない）
  const [year, setYear] = useState(() => Number((date || today).slice(0, 4)));
  const [month, setMonth] = useState(() => Number((date || today).slice(5, 7)) - 1);

  const cells = useMemo(() => buildCalendarCells(year, month), [year, month]);

  const slotsFor = (target) =>
    availableSlots({
      date: target,
      bandsByDate: availabilityByDate,
      bookedByDate,
      unrestricted,
      now,
    });

  const slots = date ? slotsFor(date) : [];

  const limit = new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1 + MONTH_RANGE, 1);
  const canGoPrev = monthKey(year, month) > today.slice(0, 7);
  const canGoNext = new Date(year, month + 1, 1) < limit;

  // 制限モードでこの月に一つも空きがないと、ユーザーは何も選べない
  const monthHasSlots = cells.some(
    (day) => day !== null && slotsFor(dateKey(year, month, day)).length > 0,
  );

  const shiftMonth = (delta) => {
    const next = new Date(year, month + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  };

  // 日付を選び直したら、時刻は選び直してもらう
  const selectDate = (target) => onChange({ date: target, time: "" });

  return (
    <div>
      {!unrestricted && (
        <p className="text-xs text-gray-500 mb-3">
          メンターが面談できる時間だけを表示しています。
        </p>
      )}

      {/* 月の切り替え */}
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          disabled={!canGoPrev}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
          aria-label="前の月"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="font-bold text-gray-800 text-sm">
          {year}年{month + 1}月
        </p>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          disabled={!canGoNext}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
          aria-label="次の月"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* カレンダー */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center text-xs font-medium text-gray-400 py-1">
            {w}
          </div>
        ))}

        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;

          const target = dateKey(year, month, day);
          const selectable = slotsFor(target).length > 0;
          const isSelected = target === date;

          return (
            <button
              key={target}
              type="button"
              onClick={() => selectDate(target)}
              disabled={!selectable}
              className={`aspect-square rounded-lg text-sm flex items-center justify-center transition-colors ${
                isSelected
                  ? "bg-blue-600 text-white font-bold"
                  : selectable
                    ? "text-gray-700 hover:bg-blue-50"
                    : "text-gray-300 cursor-not-allowed"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>

      {!monthHasSlots && (
        <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-4 py-3 mb-4">
          {year}年{month + 1}月に空いている日時はありません。
          {canGoNext ? "翌月も確認してみてください。" : "メンターにご相談ください。"}
        </p>
      )}

      {/* 時間 */}
      {date && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            希望時間（30分単位）
          </label>
          <div className="grid grid-cols-4 gap-2">
            {slots.map((slot) => {
              const taken = disabledSlotKeys?.has(`${date}|${slot}`) ?? false;
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => onChange({ date, time: slot })}
                  disabled={taken}
                  title={taken ? "他の希望で選択済みです" : undefined}
                  className={`py-2 rounded-lg text-xs font-medium border transition-colors ${
                    time === slot
                      ? "bg-blue-600 text-white border-blue-600"
                      : taken
                        ? "bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed"
                        : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                  }`}
                >
                  {slot}
                </button>
              );
            })}
          </div>
          <p className="flex items-center gap-1.5 text-xs text-gray-400 mt-2">
            <Info size={12} className="shrink-0" />
            面談は{MEETING_DURATION_MIN}分です。選んだ時刻が開始時刻になります。
          </p>
        </div>
      )}
    </div>
  );
}
