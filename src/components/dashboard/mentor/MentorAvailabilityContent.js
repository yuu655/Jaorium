"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Check,
  Copy,
  Sparkles,
  X,
} from "lucide-react";
import {
  AVAILABILITY_MONTH_RANGE,
  datesInMonth,
  derivePatternByWeekday,
  expandBands,
  groupBandsByDate,
  nowInJst,
  shiftMonth as shiftMonthKey,
  toMinutes,
} from "@/lib/schedule";
import { saveAvailability, applyWeeklyAvailability } from "./availabilityActions";
import AvailabilityTimeModal from "./AvailabilityTimeModal";
import MentorWeeklyAvailability from "./MentorWeeklyAvailability";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function monthLabelOf(month) {
  return `${Number(month.slice(0, 4))}年${Number(month.slice(5, 7))}月`;
}

function dayLabelOf(date) {
  const weekday = WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()];
  return `${Number(date.slice(5, 7))}月${Number(date.slice(8, 10))}日（${weekday}）`;
}

// その月のカレンダーを日曜始まりのマス目にする（先頭の空白はnull）
function buildCalendarCells(month) {
  const first = new Date(`${month}-01T00:00:00Z`).getUTCDay();
  return [...Array.from({ length: first }, () => null), ...datesInMonth(month)];
}

// カレンダーのマスは狭いので、スマホでは "13:00-17:00" を "13-17" に詰める
function compactTime(time) {
  return time.endsWith(":00") ? String(Number(time.slice(0, 2))) : time;
}

function sortedBands(bands) {
  return [...(bands ?? [])].sort((a, b) => toMinutes(a.start_time) - toMinutes(b.start_time));
}

function rowsFromBands(date, bands) {
  return bands.map((band) => ({ date, ...band }));
}

export default function MentorAvailabilityContent({ initialAvailability, bookedByDate }) {
  const now = useMemo(() => nowInJst(), []);
  const today = now.date;

  const [tab, setTab] = useState("month");
  const [month, setMonth] = useState(() => today.slice(0, 7));
  const [rows, setRows] = useState(() => initialAvailability ?? []);

  // 月単位タブ
  const [selectedDate, setSelectedDate] = useState(null);
  const [highlighted, setHighlighted] = useState([]);
  const [banner, setBanner] = useState(null);
  const [savedDate, setSavedDate] = useState(null);

  // 曜日タブ
  const [slotsByWeekday, setSlotsByWeekday] = useState({});
  const [mixedWeekdays, setMixedWeekdays] = useState({});
  const [editingWeekday, setEditingWeekday] = useState(null);
  const [applyMode, setApplyMode] = useState("replace");
  const [applying, setApplying] = useState(false);
  const [weeklyError, setWeeklyError] = useState(null);

  const bandsByDate = useMemo(() => groupBandsByDate(rows), [rows]);

  // 曜日フォームの初期化に使う最新の登録内容。編集中のフォームを勝手に上書きしないよう、
  // 再導出は「表示中の月が変わったとき」だけに限定する。
  const rowsRef = useRef(rows);
  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  useEffect(() => {
    const pattern = derivePatternByWeekday(rowsRef.current, { month, from: today });
    setSlotsByWeekday(
      Object.fromEntries(Object.entries(pattern).map(([weekday, p]) => [weekday, p.slots])),
    );
    setMixedWeekdays(
      Object.fromEntries(Object.entries(pattern).map(([weekday, p]) => [weekday, p.mixed])),
    );
    setWeeklyError(null);
  }, [month, today]);

  const monthLabel = monthLabelOf(month);
  const cells = useMemo(() => buildCalendarCells(month), [month]);
  const editableDates = useMemo(
    () => datesInMonth(month).filter((date) => date >= today),
    [month, today],
  );

  const canGoPrev = month > today.slice(0, 7);
  const canGoNext = month < shiftMonthKey(today.slice(0, 7), AVAILABILITY_MONTH_RANGE - 1);

  const previousMonth = shiftMonthKey(month, -1);
  const monthHasRows = rows.some((row) => row.date.startsWith(month));
  const previousMonthHasRows = rows.some((row) => row.date.startsWith(previousMonth));

  const clearNotices = () => {
    setHighlighted([]);
    setBanner(null);
  };

  const shiftMonth = (delta) => {
    setMonth((prev) => shiftMonthKey(prev, delta));
    setSelectedDate(null);
    setSavedDate(null);
    clearNotices();
  };

  const openDate = (date) => {
    setSelectedDate(date);
    setSavedDate(null);
    clearNotices();
  };

  const goToWeeklyTab = () => {
    setTab("weekly");
    clearNotices();
  };

  // ---- 保存 ----

  const handleSaveDate = async (date, slots) => {
    const result = await saveAvailability(date, slots);
    if (result?.error) return result;

    setRows((prev) => [
      ...prev.filter((row) => row.date !== date),
      ...rowsFromBands(date, result.bands),
    ]);
    setSavedDate(date);
    return result;
  };

  const handleApplyWeekly = async () => {
    setApplying(true);
    setWeeklyError(null);
    const result = await applyWeeklyAvailability(month, slotsByWeekday, applyMode);
    setApplying(false);

    if (result?.error) {
      setWeeklyError(result.error);
      return;
    }

    const applied = new Set(result.dates);
    setRows((prev) => [
      ...prev.filter((row) => !applied.has(row.date)),
      ...Object.entries(result.bandsByDate).flatMap(([date, bands]) =>
        rowsFromBands(date, bands),
      ),
    ]);

    // 反映結果はカレンダーでしか確認できないので、月単位タブに戻して該当日を強調する
    setHighlighted(result.dates);
    setBanner(
      `${monthLabel}の${result.dates.length}日分に反映しました。調整したい日をタップしてください。`,
    );
    setSavedDate(null);
    setTab("month");
  };

  const loadPreviousMonth = () => {
    const pattern = derivePatternByWeekday(rows, { month: previousMonth });
    setSlotsByWeekday(
      Object.fromEntries(Object.entries(pattern).map(([weekday, p]) => [weekday, p.slots])),
    );
    setMixedWeekdays({});
    setWeeklyError(null);
  };

  // ---- 日ごとのモーダル（前後の日へ移動できる） ----

  const selectedIndex = selectedDate ? editableDates.indexOf(selectedDate) : -1;
  const prevDate = selectedIndex > 0 ? editableDates[selectedIndex - 1] : null;
  const nextDate =
    selectedIndex >= 0 && selectedIndex < editableDates.length - 1
      ? editableDates[selectedIndex + 1]
      : null;

  const tabStyle = (name) =>
    `flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
      tab === name
        ? "border-blue-600 text-blue-600"
        : "border-transparent text-gray-500 hover:text-gray-700"
    }`;

  return (
    <>
      <div className="flex border-b">
        <button className={tabStyle("month")} onClick={() => setTab("month")}>
          <CalendarDays size={16} />
          月単位で登録
        </button>
        <button className={tabStyle("weekly")} onClick={goToWeeklyTab}>
          <CalendarRange size={16} />
          曜日から一括設定
        </button>
      </div>

      {tab === "weekly" ? (
        <MentorWeeklyAvailability
          month={month}
          monthLabel={monthLabel}
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
          onShiftMonth={shiftMonth}
          slotsByWeekday={slotsByWeekday}
          onEditWeekday={setEditingWeekday}
          onRemoveWeekday={(weekday) =>
            setSlotsByWeekday((prev) => {
              const next = { ...prev };
              delete next[weekday];
              return next;
            })
          }
          mixedWeekdays={mixedWeekdays}
          bandsByDate={bandsByDate}
          today={today}
          mode={applyMode}
          onModeChange={setApplyMode}
          onApply={handleApplyWeekly}
          applying={applying}
          canLoadPreviousMonth={previousMonthHasRows}
          onLoadPreviousMonth={loadPreviousMonth}
          error={weeklyError}
        />
      ) : (
        <div className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays size={20} className="text-blue-600" />
            <h2 className="font-bold text-lg">面談可能日時</h2>
          </div>
          <p className="text-sm text-gray-500 mb-5">
            登録すると、受験生はここで選んだ時間帯にだけ日程を提案できるようになります。
            一件も登録していない間は、これまで通り自由に提案されます。
          </p>

          {banner && (
            <div className="flex items-start gap-2 bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg px-4 py-3 mb-4">
              <Check size={16} className="shrink-0 mt-0.5" />
              <p className="flex-1">{banner}</p>
              <button
                onClick={clearNotices}
                className="text-green-600 hover:text-green-800 shrink-0"
                aria-label="閉じる"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* 月の切り替え */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => shiftMonth(-1)}
              disabled={!canGoPrev}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
              aria-label="前の月"
            >
              <ChevronLeft size={18} />
            </button>
            <p className="font-bold text-gray-800">{monthLabel}</p>
            <button
              onClick={() => shiftMonth(1)}
              disabled={!canGoNext}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
              aria-label="次の月"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* カレンダー */}
          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map((w) => (
              <div key={w} className="text-center text-xs font-medium text-gray-400 py-1">
                {w}
              </div>
            ))}

            {cells.map((date, i) => {
              if (date === null) return <div key={`empty-${i}`} />;

              const isPast = date < today;
              const bands = sortedBands(bandsByDate[date]);
              const isSelected = date === selectedDate;
              const isHighlighted = highlighted.includes(date);

              return (
                <button
                  key={date}
                  onClick={() => openDate(date)}
                  disabled={isPast}
                  className={`min-h-[60px] sm:min-h-[72px] p-1 rounded-lg text-sm flex flex-col items-center gap-0.5 transition-colors ${
                    isSelected
                      ? "bg-blue-600 text-white"
                      : isPast
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-700 hover:bg-blue-50"
                  } ${isHighlighted && !isSelected ? "ring-2 ring-blue-400" : ""}`}
                >
                  {Number(date.slice(8, 10))}

                  {/* その日の時間帯。30分刻みではなく「何時から何時まで」でまとめて出す */}
                  <span className="w-full flex flex-col items-stretch gap-0.5 text-[10px] leading-tight font-medium">
                    {bands.slice(0, 2).map((band) => (
                      <span
                        key={band.start_time}
                        className={`rounded px-0.5 py-px truncate ${
                          isSelected ? "bg-white/25 text-white" : "bg-blue-50 text-blue-700"
                        }`}
                        title={`${band.start_time}-${band.end_time}`}
                      >
                        <span className="hidden sm:inline">
                          {band.start_time}-{band.end_time}
                        </span>
                        <span className="sm:hidden">
                          {compactTime(band.start_time)}-{compactTime(band.end_time)}
                        </span>
                      </span>
                    ))}
                    {bands.length > 2 && (
                      <span className={isSelected ? "text-white/80" : "text-gray-400"}>
                        +{bands.length - 2}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {savedDate && !banner && (
            <p className="flex items-center gap-1 text-sm text-green-600 font-medium mt-4">
              <Check size={14} />
              {dayLabelOf(savedDate)}の設定を保存しました
            </p>
          )}

          {/* その月が空のときだけ、曜日からの一括設定に誘導する */}
          {!monthHasRows && (
            <button
              onClick={goToWeeklyTab}
              className="w-full mt-5 flex items-center justify-center gap-2 py-3 border border-blue-200 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors"
            >
              {previousMonthHasRows ? (
                <>
                  <Copy size={15} />
                  前月の設定を読み込んで{monthLabel}に反映する
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  曜日から一括で設定すると早く登録できます
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* 日ごとの時間入力 */}
      {selectedDate && (
        <AvailabilityTimeModal
          key={selectedDate}
          title={dayLabelOf(selectedDate)}
          initialSlots={expandBands(bandsByDate[selectedDate])}
          date={selectedDate}
          bookedTimes={bookedByDate?.[selectedDate] ?? []}
          now={now}
          onSave={(slots) => handleSaveDate(selectedDate, slots)}
          onClose={() => setSelectedDate(null)}
          onPrev={prevDate ? () => setSelectedDate(prevDate) : null}
          onNext={nextDate ? () => setSelectedDate(nextDate) : null}
        />
      )}

      {/* 曜日ごとの時間入力。ここではサーバーに保存せず、「反映する」でまとめて書き込む */}
      {editingWeekday !== null && (
        <AvailabilityTimeModal
          key={`weekday-${editingWeekday}`}
          title={`毎週 ${WEEKDAYS[editingWeekday]}曜日`}
          subtitle={`${monthLabel}の${WEEKDAYS[editingWeekday]}曜日に反映されます`}
          initialSlots={slotsByWeekday[editingWeekday] ?? []}
          now={now}
          onSave={async (slots) => {
            setSlotsByWeekday((prev) => ({ ...prev, [editingWeekday]: slots }));
            setMixedWeekdays((prev) => ({ ...prev, [editingWeekday]: false }));
            return { success: true };
          }}
          onClose={() => setEditingWeekday(null)}
        />
      )}
    </>
  );
}
