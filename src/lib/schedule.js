// 面談日時の共通ロジック。日付は "YYYY-MM-DD"、時刻は "HH:MM" の文字列で扱い、
// タイムゾーンは全てJST前提（既存の meeting_schedules.date/time と同じ運用）。

export const SLOT_MINUTES = 30;
// 面談1回の長さ。確定済み枠との重なり判定に使う。
export const MEETING_DURATION_MIN = 60;

// フリーモード（メンターが空き時間を未設定）で選べる時間の範囲
export const FREE_SLOT_START = "10:00";
export const FREE_SLOT_END = "22:00";

export function toMinutes(time) {
  if (typeof time !== "string") return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!m) return null;
  const hours = Number(m[1]);
  const minutes = Number(m[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function toTimeString(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// 帯の終端だけは "24:00"（1日の終わり）になり得る。Postgresのtime型もこれを許すが、
// 開始時刻としては不正なので toMinutes とは分けて扱う。
function toEndMinutes(time) {
  const trimmed = typeof time === "string" ? time.slice(0, 5) : time;
  return trimmed === "24:00" ? 24 * 60 : toMinutes(trimmed);
}

// DBのtime型は "13:00:00" で返るので "13:00" に丸める
export function normalizeTime(time) {
  const minutes = toEndMinutes(time);
  return minutes == null ? null : minutes === 24 * 60 ? "24:00" : toTimeString(minutes);
}

export function isSlotTime(time) {
  const minutes = toMinutes(time);
  return minutes != null && minutes % SLOT_MINUTES === 0;
}

export function isDateString(date) {
  return typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date);
}

// Asia/Tokyo基準の現在日時 { date: "YYYY-MM-DD", time: "HH:MM" }。
// Vercel(UTC)で動くサーバー側でも当日判定がずれない。クライアントの
// new Date().toISOString() はUTCなので、JSTの朝9時前に前日を返してしまう。
export function nowInJst(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const get = (type) => parts.find((p) => p.type === type)?.value;
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
  };
}

export function todayInJst(now = new Date()) {
  return nowInJst(now).date;
}

// その日時がまだ来ていないか。今日の分でも、開始時刻を過ぎた枠はもう提案できない。
export function isFutureSlot(date, time, now = nowInJst()) {
  if (!isDateString(date)) return false;
  if (date !== now.date) return date > now.date;

  const slot = toMinutes(time);
  const current = toMinutes(now.time);
  return slot != null && current != null && slot > current;
}

// 帯（13:00-17:00）を開始時刻の一覧に展開する。end_timeは面談の終わりなので含めない。
export function expandBand(band) {
  const start = toMinutes(normalizeTime(band?.start_time));
  const end = toEndMinutes(normalizeTime(band?.end_time));
  if (start == null || end == null || start >= end) return [];

  const slots = [];
  for (let m = start; m < end; m += SLOT_MINUTES) slots.push(toTimeString(m));
  return slots;
}

// 同じ日の帯をまとめて開始時刻の一覧にする（重複は除き昇順）
export function expandBands(bands) {
  const slots = new Set();
  (bands ?? []).forEach((band) => expandBand(band).forEach((s) => slots.add(s)));
  return [...slots].sort();
}

// 連続する30分スロットを帯にまとめる。保存時にDBの行数を抑えるのに使う。
export function mergeSlots(slots) {
  const sorted = [...new Set((slots ?? []).filter(isSlotTime))]
    .map(toMinutes)
    .sort((a, b) => a - b);

  const bands = [];
  sorted.forEach((minutes) => {
    const last = bands[bands.length - 1];
    if (last && last.endMinutes === minutes) {
      last.endMinutes = minutes + SLOT_MINUTES;
      return;
    }
    bands.push({ startMinutes: minutes, endMinutes: minutes + SLOT_MINUTES });
  });

  return bands.map(({ startMinutes, endMinutes }) => ({
    start_time: toTimeString(startMinutes),
    end_time: toTimeString(endMinutes),
  }));
}

// フリーモードで選べる30分刻みの時刻一覧
export function freeSlotOptions() {
  return expandBand({ start_time: FREE_SLOT_START, end_time: FREE_SLOT_END });
}

// 面談はMEETING_DURATION_MIN分あるので、開始時刻が違っても重なることがある。
// 例: 60分面談で13:00が確定済みなら、12:30と13:30も使えない（12:00と14:00は使える）。
export function overlapsBookedSlot(time, bookedTimes) {
  const start = toMinutes(time);
  if (start == null) return false;

  return (bookedTimes ?? []).some((booked) => {
    const bookedStart = toMinutes(normalizeTime(booked));
    if (bookedStart == null) return false;
    return Math.abs(bookedStart - start) < MEETING_DURATION_MIN;
  });
}

// 指定日に提案できる開始時刻の一覧。
// bandsByDate: { "2026-10-03": [{start_time,end_time}, ...] }
// bookedByDate: { "2026-10-03": ["13:00", ...] }（そのメンターが他の面談で確定済みの開始時刻）
export function availableSlots({
  date,
  bandsByDate,
  bookedByDate,
  unrestricted = false,
  now = nowInJst(),
}) {
  const slots = unrestricted ? freeSlotOptions() : expandBands(bandsByDate?.[date]);
  const booked = bookedByDate?.[date] ?? [];
  return slots.filter(
    (slot) => isFutureSlot(date, slot, now) && !overlapsBookedSlot(slot, booked),
  );
}

// 提案された日時が受け付けられるかの最終判定（サーバー側の検証で使う）
export function isProposableSlot({
  date,
  time,
  bandsByDate,
  bookedByDate,
  unrestricted = false,
  now = nowInJst(),
}) {
  if (!isDateString(date) || !isSlotTime(time)) return false;
  return availableSlots({ date, bandsByDate, bookedByDate, unrestricted, now }).includes(
    normalizeTime(time),
  );
}

// 行の配列を日付キーのオブジェクトにまとめる
export function groupBandsByDate(rows) {
  return (rows ?? []).reduce((acc, row) => {
    if (!row?.date) return acc;
    (acc[row.date] ??= []).push({
      start_time: normalizeTime(row.start_time),
      end_time: normalizeTime(row.end_time),
    });
    return acc;
  }, {});
}

// これから先に使える枠が1つでも残っているか。
// 今日の登録しかなく、その時間も過ぎている場合は「未設定」と同じ扱いにして、
// ユーザーが自由に日時を提案できるようにする。
export function hasFutureAvailability(rows, now = nowInJst()) {
  const bandsByDate = groupBandsByDate(rows);
  return Object.entries(bandsByDate).some(([date, bands]) =>
    expandBands(bands).some((slot) => isFutureSlot(date, slot, now)),
  );
}

export function groupBookedByDate(rows) {
  return (rows ?? []).reduce((acc, row) => {
    if (!row?.date || !row?.time) return acc;
    const time = normalizeTime(row.time);
    if (!time) return acc;
    (acc[row.date] ??= []).push(time);
    return acc;
  }, {});
}

// 1日は48スロット（24時間）が上限
export const MAX_SLOTS_PER_DAY = (24 * 60) / SLOT_MINUTES;

// クライアントから届いたスロット一覧を検証して保存用の帯にまとめる。
// 不正な値が1つでも混ざっていたら弾く（黙って捨てると保存結果が画面とずれるため）。
export function buildAvailabilityRows({ mentorId, date, slots, today = todayInJst() }) {
  if (!isDateString(date)) return { error: "日付が不正です" };
  if (date < today) return { error: "過去の日付は設定できません" };

  const list = Array.isArray(slots) ? slots : [];
  if (list.length > MAX_SLOTS_PER_DAY) return { error: "時間帯が多すぎます" };
  if (!list.every(isSlotTime)) return { error: "時間は30分単位で指定してください" };

  const rows = mergeSlots(list).map((band) => ({
    mentor_id: mentorId,
    date,
    start_time: band.start_time,
    end_time: band.end_time,
  }));

  return { rows };
}

// ---- 曜日からの一括設定 ----

// モーダルの「よく使う時間帯」。FREE_SLOT_START/END の範囲に収める。
export const TIME_PRESETS = [
  { label: "午前", start: "10:00", end: "12:00" },
  { label: "午後", start: "13:00", end: "18:00" },
  { label: "夜", start: "18:00", end: "22:00" },
  { label: "終日", start: FREE_SLOT_START, end: FREE_SLOT_END },
];

// 面談可能日時を登録できる範囲（当月を含めて何ヶ月先まで）
export const AVAILABILITY_MONTH_RANGE = 3;

export function isMonthString(month) {
  return typeof month === "string" && /^\d{4}-\d{2}$/.test(month);
}

// 曜日番号（0=日 … 6=土）。ローカルタイムゾーンに影響されないようUTCで解釈する。
export function weekdayOf(date) {
  if (!isDateString(date)) return null;
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

// "2026-10" を delta ヶ月ずらす
export function shiftMonth(month, delta) {
  if (!isMonthString(month)) return null;
  const shifted = new Date(
    Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1 + delta, 1),
  );
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function datesInMonth(month) {
  if (!isMonthString(month)) return [];
  const year = Number(month.slice(0, 4));
  const monthIndex = Number(month.slice(5, 7)) - 1;
  const days = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  return Array.from(
    { length: days },
    (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`,
  );
}

// 指定月のうち、その曜日にあたる日付。fromを渡すとそれ以前の日を除く。
export function datesOfWeekdaysInMonth(month, weekdays, { from } = {}) {
  const targets = new Set((weekdays ?? []).map(Number));
  return datesInMonth(month).filter(
    (date) => targets.has(weekdayOf(date)) && (!from || date >= from),
  );
}

// 開始〜終了（終了は含まない）を30分スロットに開く。モーダルの帯追加で使う。
export function expandRange(start, end) {
  return expandBand({ start_time: start, end_time: end });
}

function slotKey(slots) {
  return [...slots].sort().join(",");
}

// 既存の登録から曜日ごとの時間帯を逆算する（曜日タブの初期値・前月の読み込み）。
// その曜日の中で内容が割れている場合は mixed を立て、最も多いパターンを返す。
export function derivePatternByWeekday(rows, { month, from } = {}) {
  const bandsByDate = groupBandsByDate(rows);
  const pattern = {};

  for (let weekday = 0; weekday < 7; weekday += 1) {
    const sets = datesOfWeekdaysInMonth(month, [weekday], { from })
      .map((date) => expandBands(bandsByDate[date]))
      .filter((slots) => slots.length > 0);

    if (sets.length === 0) continue;

    const counts = new Map();
    sets.forEach((slots) => {
      const key = slotKey(slots);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });

    const [topKey] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    pattern[weekday] = {
      slots: topKey.split(","),
      mixed: counts.size > 1,
    };
  }

  return pattern;
}

// 反映対象の日のうち、既に別の内容が入っている日（＝個別に調整済みで上書きされる日）
export function datesOverwrittenByPattern({
  month,
  slotsByWeekday,
  bandsByDate = {},
  now = nowInJst(),
}) {
  return Object.entries(slotsByWeekday ?? {})
    .flatMap(([weekday, slots]) =>
      datesOfWeekdaysInMonth(month, [weekday], { from: now.date }).map((date) => ({
        date,
        slots: slots ?? [],
      })),
    )
    .filter(({ date, slots }) => {
      const current = expandBands(bandsByDate[date]);
      if (current.length === 0) return false; // 未設定の日は「上書き」ではない
      const applied = slots.filter((slot) => isFutureSlot(date, slot, now));
      return slotKey(current) !== slotKey(applied);
    })
    .map(({ date }) => date);
}

// 曜日パターンを月に反映するときの、日付ごとの保存内容を組み立てる。
// slotsByWeekday はキーが存在する曜日だけが対象。値が空配列なら「その曜日を空きなしにする」。
export function buildWeeklyApplyPlan({
  mentorId,
  month,
  slotsByWeekday,
  mode = "replace",
  bandsByDate = {},
  now = nowInJst(),
}) {
  if (!isMonthString(month)) return { error: "月が不正です" };
  if (mode !== "replace" && mode !== "merge") return { error: "反映方法が不正です" };

  const entries = Object.entries(slotsByWeekday ?? {});
  if (entries.length === 0) return { error: "反映する曜日がありません" };

  const targets = entries.flatMap(([weekday, slots]) =>
    datesOfWeekdaysInMonth(month, [weekday], { from: now.date }).map((date) => {
      const base = mode === "merge" ? expandBands(bandsByDate[date]) : [];
      // 今日の分は、すでに過ぎた時間を落としてから保存する
      const merged = [...new Set([...base, ...(slots ?? [])])].filter((slot) =>
        isFutureSlot(date, slot, now),
      );
      return { date, slots: merged.sort() };
    }),
  );

  const rows = [];
  for (const target of targets) {
    const { rows: dayRows, error } = buildAvailabilityRows({
      mentorId,
      date: target.date,
      slots: target.slots,
      today: now.date,
    });
    if (error) return { error };
    rows.push(...dayRows);
  }

  return { dates: targets.map((t) => t.date), rows };
}

// ---- 日時提案（第1〜第3希望）----

// 1つの提案メッセージに載せられる希望の数
export const MAX_DATE_PROPOSALS = 3;

export function proposalLabel(index) {
  return `第${index + 1}希望`;
}

// messages.content の形式: "YYYY-MM-DD|HH:MM" をカンマで第1希望から連結したもの。
// 第2・第3希望を導入する前のメッセージ（カンマなし）は1件としてそのまま読める。
export function parseProposals(content) {
  if (typeof content !== "string") return [];

  return content
    .split(",")
    .map((part) => {
      const [date, time] = part.trim().split("|");
      // DBのtime型やコピーされた値を "HH:MM" に丸めてから検証する
      const normalized = normalizeTime(time);
      if (!isDateString(date) || !normalized || !isSlotTime(normalized)) return null;
      return { date, time: normalized };
    })
    .filter(Boolean);
}

export function formatProposals(choices) {
  return (choices ?? []).map(({ date, time }) => `${date}|${time}`).join(",");
}

// 提案を送る前の最終判定。UIでも絞っているが、サーバー側はこれを通す。
// 希望どうしが60分枠として重なること（13:00と13:30）は、確定するのが片方だけ
// なので許容する。完全に同じ日時だけ弾く。
export function validateProposalChoices({
  choices,
  bandsByDate,
  bookedByDate,
  unrestricted = false,
  now = nowInJst(),
}) {
  const list = Array.isArray(choices) ? choices : [];
  if (list.length === 0) return { error: "日時を選択してください" };
  if (list.length > MAX_DATE_PROPOSALS) {
    return { error: `日時は${MAX_DATE_PROPOSALS}つまで選択できます` };
  }

  const seen = new Set();
  for (const choice of list) {
    const key = `${choice?.date}|${choice?.time}`;
    if (seen.has(key)) return { error: "同じ日時は選べません" };
    seen.add(key);
  }

  for (const [index, choice] of list.entries()) {
    const proposable = isProposableSlot({
      date: choice?.date,
      time: choice?.time,
      bandsByDate,
      bookedByDate,
      unrestricted,
      now,
    });
    if (!proposable) {
      return {
        error: `${proposalLabel(index)}の日時は提案できません。空き状況を確認してください`,
      };
    }
  }

  return { choices: list };
}

// "2026-10-03" → "2026年10月3日"。チャットの吹き出しと通知メールで共用する。
export function formatProposalDate(date) {
  if (!isDateString(date)) return date ?? "";
  const [year, month, day] = date.split("-");
  return `${year}年${Number(month)}月${Number(day)}日`;
}

// 希望日時を「第1希望: 2026年10月3日 13:00」の行にする（メール本文など）
export function formatProposalLines(choices) {
  const list = choices ?? [];
  return list.map(
    (choice, index) =>
      `${list.length > 1 ? `${proposalLabel(index)}: ` : ""}${formatProposalDate(choice.date)} ${choice.time}`,
  );
}

// 第1〜第3希望の入力欄の初期値。未選択の枠は null（第2・第3希望は任意）
export function emptyChoices() {
  return Array.from({ length: MAX_DATE_PROPOSALS }, () => null);
}

// 日付だけ選んで時刻が未選択の枠は「未入力」として扱う。
// 第2希望を飛ばして第3希望だけ選んだ場合も、順序を保ったまま詰める。
export function selectedChoices(choices) {
  return (choices ?? []).filter((choice) => choice?.date && choice?.time);
}
