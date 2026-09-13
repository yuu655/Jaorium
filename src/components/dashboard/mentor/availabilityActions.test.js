import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseMock, createChain } from "@/test/supabaseMock";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { saveAvailability, applyWeeklyAvailability } from "./availabilityActions";
import { todayInJst } from "@/lib/schedule";

// 過去日チェックに引っかからないよう、常に十分未来の日付を使う
const futureDate = `${Number(todayInJst().slice(0, 4)) + 1}-10-03`;

function mockMentor({ user = { id: "mentor-1" }, chain = createChain({ data: null, error: null }) } = {}) {
  createClient.mockResolvedValue(
    createSupabaseMock({
      auth: { getUser: vi.fn(async () => ({ data: { user } })) },
      from: { mentor_availabilities: () => chain },
    }),
  );
  return chain;
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("saveAvailability", () => {
  it("replaces the day's rows with the merged bands", async () => {
    const chain = mockMentor();

    const result = await saveAvailability(futureDate, ["13:00", "13:30", "16:00"]);

    expect(result).toEqual({
      success: true,
      bands: [
        { start_time: "13:00", end_time: "14:00" },
        { start_time: "16:00", end_time: "16:30" },
      ],
    });
    // 既存行を消してから入れ直すので、帯が重複することがない
    expect(chain.delete).toHaveBeenCalled();
    expect(chain.eq).toHaveBeenCalledWith("mentor_id", "mentor-1");
    expect(chain.eq).toHaveBeenCalledWith("date", futureDate);
    expect(chain.insert).toHaveBeenCalledWith([
      { mentor_id: "mentor-1", date: futureDate, start_time: "13:00", end_time: "14:00" },
      { mentor_id: "mentor-1", date: futureDate, start_time: "16:00", end_time: "16:30" },
    ]);
  });

  it("clears the day without inserting when no slots are selected", async () => {
    const chain = mockMentor();

    const result = await saveAvailability(futureDate, []);

    expect(result).toEqual({ success: true, bands: [] });
    expect(chain.delete).toHaveBeenCalled();
    expect(chain.insert).not.toHaveBeenCalled();
  });

  it("requires authentication", async () => {
    const chain = mockMentor({ user: null });

    const result = await saveAvailability(futureDate, ["13:00"]);

    expect(result).toEqual({ error: "ログインが必要です" });
    expect(chain.delete).not.toHaveBeenCalled();
  });

  it("rejects off-grid times before touching the database", async () => {
    const chain = mockMentor();

    const result = await saveAvailability(futureDate, ["13:15"]);

    expect(result).toEqual({ error: "時間は30分単位で指定してください" });
    expect(chain.delete).not.toHaveBeenCalled();
  });

  it("rejects past dates", async () => {
    const chain = mockMentor();

    const result = await saveAvailability("2020-01-01", ["13:00"]);

    expect(result).toEqual({ error: "過去の日付は設定できません" });
    expect(chain.delete).not.toHaveBeenCalled();
  });

  it("reports a failure when the insert is rejected (e.g. by RLS)", async () => {
    mockMentor({ chain: createChain({ data: null, error: { message: "denied" } }) });

    const result = await saveAvailability(futureDate, ["13:00"]);

    expect(result).toEqual({ error: "保存に失敗しました" });
  });
});

describe("applyWeeklyAvailability", () => {
  // 反映対象が過去日にならないよう、常に来年の10月を使う
  const MONTH = `${new Date().getFullYear() + 1}-10`;

  function mockWithExisting(existing = []) {
    const chain = createChain({ data: existing, error: null });
    createClient.mockResolvedValue(
      createSupabaseMock({
        auth: { getUser: vi.fn(async () => ({ data: { user: { id: "mentor-1" } } })) },
        from: { mentor_availabilities: () => chain },
      }),
    );
    return chain;
  }

  it("reads the month with a half-open range (month-end days differ per month)", async () => {
    const chain = mockWithExisting();
    const february = `${new Date().getFullYear() + 1}-02`;

    await applyWeeklyAvailability(february, { 2: ["13:00"] });

    expect(chain.gte).toHaveBeenCalledWith("date", `${february}-01`);
    expect(chain.lt).toHaveBeenCalledWith("date", `${new Date().getFullYear() + 1}-03-01`);
  });

  it("writes every matching date with one delete and one insert", async () => {
    const chain = mockWithExisting();

    const result = await applyWeeklyAvailability(MONTH, { 2: ["13:00", "13:30"] });

    expect(result.success).toBe(true);
    expect(result.dates.length).toBeGreaterThan(3); // 月内の火曜すべて
    expect(chain.delete).toHaveBeenCalledTimes(1);
    expect(chain.in).toHaveBeenCalledWith("date", result.dates);
    expect(chain.insert).toHaveBeenCalledTimes(1);
    // 連続スロットは1本の帯にまとまる
    expect(chain.insert.mock.calls[0][0][0]).toEqual({
      mentor_id: "mentor-1",
      date: result.dates[0],
      start_time: "13:00",
      end_time: "14:00",
    });
  });

  it("clears the weekday when the pattern is empty", async () => {
    const chain = mockWithExisting();

    const result = await applyWeeklyAvailability(MONTH, { 2: [] });

    expect(result.success).toBe(true);
    expect(chain.delete).toHaveBeenCalledTimes(1);
    expect(chain.insert).not.toHaveBeenCalled();
  });

  it("keeps the existing slots when merging", async () => {
    const firstTuesday = `${MONTH}-05`;
    const chain = mockWithExisting([
      { date: firstTuesday, start_time: "19:00:00", end_time: "19:30:00" },
    ]);

    const result = await applyWeeklyAvailability(MONTH, { 2: ["13:00"] }, "merge");
    const inserted = chain.insert.mock.calls[0][0].filter((r) => r.date === firstTuesday);

    expect(result.success).toBe(true);
    expect(inserted.map((r) => r.start_time).sort()).toEqual(["13:00", "19:00"]);
  });

  it("requires authentication and rejects malformed input", async () => {
    createClient.mockResolvedValue(
      createSupabaseMock({ auth: { getUser: vi.fn(async () => ({ data: { user: null } })) } }),
    );
    expect(await applyWeeklyAvailability(MONTH, { 2: ["13:00"] })).toEqual({
      error: "ログインが必要です",
    });

    mockWithExisting();
    expect(await applyWeeklyAvailability("2026/10", { 2: ["13:00"] })).toEqual({
      error: "月が不正です",
    });
    expect(await applyWeeklyAvailability(MONTH, {})).toEqual({
      error: "反映する曜日がありません",
    });
    expect(await applyWeeklyAvailability(MONTH, { 2: ["13:15"] })).toEqual({
      error: "時間は30分単位で指定してください",
    });
  });

  it("reports a failure when the write is rejected", async () => {
    const chain = createChain({ data: [], error: { message: "denied" } });
    createClient.mockResolvedValue(
      createSupabaseMock({
        auth: { getUser: vi.fn(async () => ({ data: { user: { id: "mentor-1" } } })) },
        from: { mentor_availabilities: () => chain },
      }),
    );

    expect(await applyWeeklyAvailability(MONTH, { 2: ["13:00"] })).toEqual({
      error: "反映に失敗しました",
    });
  });
});
