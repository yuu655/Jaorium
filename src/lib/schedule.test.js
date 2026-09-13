import { describe, it, expect } from "vitest";
import {
  MEETING_DURATION_MIN,
  isSlotTime,
  normalizeTime,
  todayInJst,
  nowInJst,
  isFutureSlot,
  hasFutureAvailability,
  expandBand,
  expandBands,
  mergeSlots,
  freeSlotOptions,
  overlapsBookedSlot,
  availableSlots,
  isProposableSlot,
  groupBandsByDate,
  groupBookedByDate,
  buildAvailabilityRows,
  datesOfWeekdaysInMonth,
  derivePatternByWeekday,
  datesOverwrittenByPattern,
  buildWeeklyApplyPlan,
} from "./schedule";

describe("isSlotTime", () => {
  it("accepts 30-minute marks only", () => {
    expect(isSlotTime("13:00")).toBe(true);
    expect(isSlotTime("13:30")).toBe(true);
    expect(isSlotTime("13:15")).toBe(false);
    expect(isSlotTime("13:01")).toBe(false);
  });

  it("rejects malformed or out-of-range input", () => {
    expect(isSlotTime("")).toBe(false);
    expect(isSlotTime("1300")).toBe(false);
    expect(isSlotTime("24:00")).toBe(false);
    expect(isSlotTime(null)).toBe(false);
    expect(isSlotTime(1300)).toBe(false);
  });
});

describe("normalizeTime", () => {
  it("trims the seconds Postgres time columns come back with", () => {
    expect(normalizeTime("13:00:00")).toBe("13:00");
    expect(normalizeTime("09:30")).toBe("09:30");
    expect(normalizeTime("9:30")).toBe("09:30");
    expect(normalizeTime("bogus")).toBe(null);
  });
});

describe("todayInJst / nowInJst", () => {
  it("returns the JST date, not the UTC one", () => {
    // 2026-10-02T23:30Z は日本時間だと 2026-10-03 08:30
    expect(todayInJst(new Date("2026-10-02T23:30:00Z"))).toBe("2026-10-03");
    // 2026-10-03T00:30Z（JST 09:30）も同じ日
    expect(todayInJst(new Date("2026-10-03T00:30:00Z"))).toBe("2026-10-03");
  });

  it("returns the JST time of day too", () => {
    expect(nowInJst(new Date("2026-10-02T23:30:00Z"))).toEqual({
      date: "2026-10-03",
      time: "08:30",
    });
    // 深夜0時台は "24:xx" ではなく "00:xx"
    expect(nowInJst(new Date("2026-10-02T15:10:00Z"))).toEqual({
      date: "2026-10-03",
      time: "00:10",
    });
  });
});

describe("isFutureSlot", () => {
  const now = { date: "2026-10-03", time: "14:10" };

  it("keeps only the slots still ahead of us today", () => {
    expect(isFutureSlot("2026-10-03", "14:30", now)).toBe(true);
    expect(isFutureSlot("2026-10-03", "14:00", now)).toBe(false);
    expect(isFutureSlot("2026-10-03", "10:00", now)).toBe(false);
  });

  it("compares by date on other days", () => {
    expect(isFutureSlot("2026-10-04", "00:00", now)).toBe(true);
    expect(isFutureSlot("2026-10-02", "23:30", now)).toBe(false);
    expect(isFutureSlot("bogus", "10:00", now)).toBe(false);
  });
});

describe("hasFutureAvailability", () => {
  const now = { date: "2026-10-03", time: "14:10" };

  it("is true while a slot is still ahead", () => {
    expect(
      hasFutureAvailability(
        [{ date: "2026-10-03", start_time: "14:00:00", end_time: "15:00:00" }],
        now,
      ),
    ).toBe(true);
  });

  it("is false when today's slots have all passed", () => {
    // 登録はあるが 10:00-12:00 だけ → 14:10時点ではもう使えない＝未設定と同じ扱い
    expect(
      hasFutureAvailability(
        [{ date: "2026-10-03", start_time: "10:00:00", end_time: "12:00:00" }],
        now,
      ),
    ).toBe(false);
  });

  it("is false with no rows at all", () => {
    expect(hasFutureAvailability([], now)).toBe(false);
    expect(hasFutureAvailability(undefined, now)).toBe(false);
  });

  it("looks at later dates too", () => {
    expect(
      hasFutureAvailability(
        [
          { date: "2026-10-03", start_time: "10:00:00", end_time: "12:00:00" },
          { date: "2026-10-09", start_time: "10:00:00", end_time: "12:00:00" },
        ],
        now,
      ),
    ).toBe(true);
  });
});

describe("expandBand", () => {
  it("lists start times and excludes the band's end", () => {
    expect(expandBand({ start_time: "13:00", end_time: "15:00" })).toEqual([
      "13:00",
      "13:30",
      "14:00",
      "14:30",
    ]);
  });

  it("handles a band that runs to the end of the day", () => {
    // 23:30 を選ぶと 23:30-24:00 として保存される。24:00は開始時刻にはならない。
    expect(expandBand({ start_time: "23:30", end_time: "24:00" })).toEqual(["23:30"]);
    expect(isSlotTime("24:00")).toBe(false);
    expect(mergeSlots(["23:30"])).toEqual([{ start_time: "23:30", end_time: "24:00" }]);
  });

  it("handles Postgres time strings and rejects inverted bands", () => {
    expect(expandBand({ start_time: "10:00:00", end_time: "11:00:00" })).toEqual(["10:00", "10:30"]);
    expect(expandBand({ start_time: "15:00", end_time: "13:00" })).toEqual([]);
    expect(expandBand(null)).toEqual([]);
  });
});

describe("expandBands", () => {
  it("merges overlapping bands into a sorted, de-duplicated list", () => {
    const slots = expandBands([
      { start_time: "13:00", end_time: "14:00" },
      { start_time: "13:30", end_time: "14:30" },
      { start_time: "10:00", end_time: "10:30" },
    ]);

    expect(slots).toEqual(["10:00", "13:00", "13:30", "14:00"]);
  });
});

describe("mergeSlots", () => {
  it("groups consecutive slots into bands", () => {
    expect(mergeSlots(["13:00", "13:30", "14:00", "16:00"])).toEqual([
      { start_time: "13:00", end_time: "14:30" },
      { start_time: "16:00", end_time: "16:30" },
    ]);
  });

  it("sorts, de-duplicates and drops non-slot times", () => {
    expect(mergeSlots(["14:00", "13:30", "13:30", "13:15"])).toEqual([
      { start_time: "13:30", end_time: "14:30" },
    ]);
    expect(mergeSlots([])).toEqual([]);
    expect(mergeSlots(undefined)).toEqual([]);
  });

  it("round-trips with expandBand", () => {
    const slots = ["13:00", "13:30", "14:00"];
    expect(expandBands(mergeSlots(slots))).toEqual(slots);
  });
});

describe("overlapsBookedSlot", () => {
  it("blocks slots that overlap a confirmed meeting", () => {
    expect(MEETING_DURATION_MIN).toBe(60);
    expect(overlapsBookedSlot("13:00", ["13:00"])).toBe(true);
    expect(overlapsBookedSlot("13:30", ["13:00"])).toBe(true);
    expect(overlapsBookedSlot("12:30", ["13:00"])).toBe(true);
  });

  it("allows slots that only touch a confirmed meeting", () => {
    expect(overlapsBookedSlot("14:00", ["13:00"])).toBe(false);
    expect(overlapsBookedSlot("12:00", ["13:00"])).toBe(false);
    expect(overlapsBookedSlot("13:00", [])).toBe(false);
    expect(overlapsBookedSlot("13:00", ["bogus"])).toBe(false);
  });
});

describe("availableSlots", () => {
  const bandsByDate = { "2026-10-03": [{ start_time: "13:00", end_time: "15:00" }] };
  const now = { date: "2026-10-01", time: "09:00" };

  it("returns the mentor's slots minus the ones overlapping confirmed meetings", () => {
    expect(
      availableSlots({
        date: "2026-10-03",
        bandsByDate,
        bookedByDate: { "2026-10-03": ["13:30"] },
        now,
      }),
    ).toEqual(["14:30"]);
  });

  it("returns nothing for a date the mentor did not open", () => {
    expect(availableSlots({ date: "2026-10-04", bandsByDate, bookedByDate: {}, now })).toEqual([]);
  });

  it("falls back to the full range when unrestricted", () => {
    const slots = availableSlots({ date: "2026-10-04", bandsByDate: {}, unrestricted: true, now });

    expect(slots[0]).toBe("10:00");
    expect(slots.at(-1)).toBe("21:30");
    expect(slots).toEqual(freeSlotOptions());
  });

  it("drops the slots that have already passed today", () => {
    const slots = availableSlots({
      date: "2026-10-03",
      bandsByDate,
      unrestricted: false,
      now: { date: "2026-10-03", time: "13:40" },
    });

    expect(slots).toEqual(["14:00", "14:30"]);
  });

  it("still hides booked slots when unrestricted", () => {
    const slots = availableSlots({
      date: "2026-10-04",
      bandsByDate: {},
      bookedByDate: { "2026-10-04": ["13:00"] },
      unrestricted: true,
      now,
    });

    expect(slots).not.toContain("13:00");
    expect(slots).not.toContain("13:30");
    expect(slots).toContain("14:00");
  });
});

describe("isProposableSlot", () => {
  const bandsByDate = { "2026-10-03": [{ start_time: "13:00", end_time: "15:00" }] };
  const now = { date: "2026-10-01", time: "09:00" };

  it("accepts a slot inside the mentor's availability", () => {
    expect(isProposableSlot({ date: "2026-10-03", time: "13:00", bandsByDate, now })).toBe(true);
  });

  it("rejects a slot outside the mentor's availability", () => {
    expect(isProposableSlot({ date: "2026-10-03", time: "16:00", bandsByDate, now })).toBe(false);
    expect(isProposableSlot({ date: "2026-10-04", time: "13:00", bandsByDate, now })).toBe(false);
  });

  it("rejects off-grid times even when unrestricted", () => {
    expect(
      isProposableSlot({ date: "2026-10-03", time: "13:15", unrestricted: true, now }),
    ).toBe(false);
  });

  it("rejects past dates and malformed input", () => {
    expect(
      isProposableSlot({ date: "2026-09-30", time: "13:00", unrestricted: true, now }),
    ).toBe(false);
    expect(isProposableSlot({ date: "10/3", time: "13:00", unrestricted: true, now })).toBe(false);
  });

  it("rejects a slot taken by another confirmed meeting", () => {
    expect(
      isProposableSlot({
        date: "2026-10-03",
        time: "13:30",
        bandsByDate,
        bookedByDate: { "2026-10-03": ["13:00"] },
        now,
      }),
    ).toBe(false);
  });
});

describe("grouping helpers", () => {
  it("groups availability rows by date and trims seconds", () => {
    expect(
      groupBandsByDate([
        { date: "2026-10-03", start_time: "13:00:00", end_time: "15:00:00" },
        { date: "2026-10-03", start_time: "19:00:00", end_time: "20:00:00" },
        { date: "2026-10-05", start_time: "10:00:00", end_time: "11:00:00" },
      ]),
    ).toEqual({
      "2026-10-03": [
        { start_time: "13:00", end_time: "15:00" },
        { start_time: "19:00", end_time: "20:00" },
      ],
      "2026-10-05": [{ start_time: "10:00", end_time: "11:00" }],
    });
  });

  it("groups confirmed schedules by date and skips incomplete rows", () => {
    expect(
      groupBookedByDate([
        { date: "2026-10-03", time: "13:00" },
        { date: "2026-10-03", time: null },
        { date: null, time: "14:00" },
      ]),
    ).toEqual({ "2026-10-03": ["13:00"] });
  });
});

describe("buildAvailabilityRows", () => {
  const base = { mentorId: "mentor-1", date: "2026-10-03", today: "2026-10-01" };

  it("merges the submitted slots into rows for the mentor", () => {
    const { rows } = buildAvailabilityRows({ ...base, slots: ["13:00", "13:30", "16:00"] });

    expect(rows).toEqual([
      { mentor_id: "mentor-1", date: "2026-10-03", start_time: "13:00", end_time: "14:00" },
      { mentor_id: "mentor-1", date: "2026-10-03", start_time: "16:00", end_time: "16:30" },
    ]);
  });

  it("returns no rows when the day is cleared", () => {
    expect(buildAvailabilityRows({ ...base, slots: [] })).toEqual({ rows: [] });
  });

  it("rejects off-grid times instead of silently dropping them", () => {
    expect(buildAvailabilityRows({ ...base, slots: ["13:00", "13:15"] })).toEqual({
      error: "時間は30分単位で指定してください",
    });
  });

  it("rejects past dates and malformed dates", () => {
    expect(buildAvailabilityRows({ ...base, date: "2026-09-30", slots: ["13:00"] })).toEqual({
      error: "過去の日付は設定できません",
    });
    expect(buildAvailabilityRows({ ...base, date: "10/3", slots: ["13:00"] })).toEqual({
      error: "日付が不正です",
    });
  });

  it("rejects an implausible number of slots", () => {
    const slots = Array.from({ length: 49 }, (_, i) => `${String(i).padStart(2, "0")}:00`);

    expect(buildAvailabilityRows({ ...base, slots })).toEqual({ error: "時間帯が多すぎます" });
  });
});

describe("datesOfWeekdaysInMonth", () => {
  it("lists the dates of the given weekdays in the month", () => {
    // 2026-10-01 は木曜
    expect(datesOfWeekdaysInMonth("2026-10", [2])).toEqual([
      "2026-10-06",
      "2026-10-13",
      "2026-10-20",
      "2026-10-27",
    ]);
  });

  it("skips dates before `from` and handles multiple weekdays", () => {
    expect(datesOfWeekdaysInMonth("2026-10", [2, 4], { from: "2026-10-14" })).toEqual([
      "2026-10-15",
      "2026-10-20",
      "2026-10-22",
      "2026-10-27",
      "2026-10-29",
    ]);
  });

  it("returns nothing for a malformed month", () => {
    expect(datesOfWeekdaysInMonth("2026/10", [2])).toEqual([]);
  });
});

describe("derivePatternByWeekday", () => {
  const month = "2026-10";

  it("derives one pattern per weekday", () => {
    const rows = [
      { date: "2026-10-06", start_time: "13:00:00", end_time: "14:00:00" },
      { date: "2026-10-13", start_time: "13:00:00", end_time: "14:00:00" },
      { date: "2026-10-01", start_time: "19:00:00", end_time: "20:00:00" },
    ];

    expect(derivePatternByWeekday(rows, { month })).toEqual({
      2: { slots: ["13:00", "13:30"], mixed: false },
      4: { slots: ["19:00", "19:30"], mixed: false },
    });
  });

  it("flags a weekday whose days disagree and keeps the most common one", () => {
    const rows = [
      { date: "2026-10-06", start_time: "13:00:00", end_time: "13:30:00" },
      { date: "2026-10-13", start_time: "13:00:00", end_time: "13:30:00" },
      { date: "2026-10-20", start_time: "19:00:00", end_time: "19:30:00" },
    ];

    expect(derivePatternByWeekday(rows, { month })[2]).toEqual({
      slots: ["13:00"],
      mixed: true,
    });
  });

  it("ignores days before `from`", () => {
    const rows = [{ date: "2026-10-06", start_time: "13:00:00", end_time: "13:30:00" }];

    expect(derivePatternByWeekday(rows, { month, from: "2026-10-10" })).toEqual({});
  });
});

describe("datesOverwrittenByPattern", () => {
  const now = { date: "2026-10-01", time: "09:00" };

  it("reports only the days that already hold something different", () => {
    const dates = datesOverwrittenByPattern({
      month: "2026-10",
      slotsByWeekday: { 2: ["13:00"] },
      bandsByDate: {
        "2026-10-06": [{ start_time: "19:00", end_time: "19:30" }], // 個別に調整済み
        "2026-10-13": [{ start_time: "13:00", end_time: "13:30" }], // パターンと同じ
        // 10-20, 10-27 は未設定
      },
      now,
    });

    expect(dates).toEqual(["2026-10-06"]);
  });
});

describe("buildWeeklyApplyPlan", () => {
  const base = { mentorId: "mentor-1", month: "2026-10", now: { date: "2026-10-01", time: "09:00" } };

  it("expands the weekday pattern into rows for every matching date", () => {
    const { dates, rows } = buildWeeklyApplyPlan({ ...base, slotsByWeekday: { 2: ["13:00", "13:30"] } });

    expect(dates).toEqual(["2026-10-06", "2026-10-13", "2026-10-20", "2026-10-27"]);
    expect(rows).toHaveLength(4);
    expect(rows[0]).toEqual({
      mentor_id: "mentor-1",
      date: "2026-10-06",
      start_time: "13:00",
      end_time: "14:00",
    });
  });

  it("replaces by default and keeps existing slots when merging", () => {
    const bandsByDate = { "2026-10-06": [{ start_time: "19:00", end_time: "19:30" }] };

    const replaced = buildWeeklyApplyPlan({
      ...base,
      slotsByWeekday: { 2: ["13:00"] },
      bandsByDate,
    });
    expect(replaced.rows.filter((r) => r.date === "2026-10-06")).toEqual([
      { mentor_id: "mentor-1", date: "2026-10-06", start_time: "13:00", end_time: "13:30" },
    ]);

    const merged = buildWeeklyApplyPlan({
      ...base,
      slotsByWeekday: { 2: ["13:00"] },
      bandsByDate,
      mode: "merge",
    });
    expect(merged.rows.filter((r) => r.date === "2026-10-06")).toEqual([
      { mentor_id: "mentor-1", date: "2026-10-06", start_time: "13:00", end_time: "13:30" },
      { mentor_id: "mentor-1", date: "2026-10-06", start_time: "19:00", end_time: "19:30" },
    ]);
  });

  it("produces a date with no rows when the weekday is cleared", () => {
    const { dates, rows } = buildWeeklyApplyPlan({ ...base, slotsByWeekday: { 2: [] } });

    expect(dates).toHaveLength(4);
    expect(rows).toEqual([]);
  });

  it("drops today's slots that have already passed", () => {
    // 2026-10-01 は木曜。今が18:00なら、その日の13:00は反映しない
    const { rows } = buildWeeklyApplyPlan({
      ...base,
      now: { date: "2026-10-01", time: "18:00" },
      slotsByWeekday: { 4: ["13:00", "19:00"] },
    });

    expect(rows.filter((r) => r.date === "2026-10-01")).toEqual([
      { mentor_id: "mentor-1", date: "2026-10-01", start_time: "19:00", end_time: "19:30" },
    ]);
  });

  it("skips dates before today", () => {
    const { dates } = buildWeeklyApplyPlan({
      ...base,
      now: { date: "2026-10-15", time: "09:00" },
      slotsByWeekday: { 2: ["13:00"] },
    });

    expect(dates).toEqual(["2026-10-20", "2026-10-27"]);
  });

  it("rejects malformed input", () => {
    expect(buildWeeklyApplyPlan({ ...base, month: "2026/10", slotsByWeekday: { 2: ["13:00"] } })).toEqual({
      error: "月が不正です",
    });
    expect(buildWeeklyApplyPlan({ ...base, slotsByWeekday: {} })).toEqual({
      error: "反映する曜日がありません",
    });
    expect(buildWeeklyApplyPlan({ ...base, slotsByWeekday: { 2: ["13:15"] } })).toEqual({
      error: "時間は30分単位で指定してください",
    });
    expect(
      buildWeeklyApplyPlan({ ...base, slotsByWeekday: { 2: ["13:00"] }, mode: "bogus" }),
    ).toEqual({ error: "反映方法が不正です" });
  });
});
