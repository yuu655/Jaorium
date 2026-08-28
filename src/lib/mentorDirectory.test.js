import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchAllRows, fetchMentorDirectory, SUPABASE_MAX_ROWS } from "./mentorDirectory";

// range(from, to) を受けて該当範囲を返す、行数上限つきのテーブルモック。
function createTable(rows, { pageSize = SUPABASE_MAX_ROWS, error = null } = {}) {
  const calls = [];
  const chain = {
    select: vi.fn(() => chain),
    range: vi.fn(async (from, to) => {
      calls.push([from, to]);
      if (error) return { data: null, error };
      const limit = Math.min(to - from + 1, pageSize);
      return { data: rows.slice(from, from + limit), error: null };
    }),
  };
  return { chain, calls };
}

function createSupabase(tables) {
  return {
    from: vi.fn((table) => tables[table]?.chain ?? createTable([]).chain),
  };
}

describe("fetchAllRows", () => {
  it("returns every row in one call when the table fits under the cap", async () => {
    const { chain, calls } = createTable([{ id: 1 }, { id: 2 }]);
    const rows = await fetchAllRows(() => chain.select());

    expect(rows).toEqual([{ id: 1 }, { id: 2 }]);
    expect(calls).toEqual([[0, SUPABASE_MAX_ROWS - 1]]);
  });

  it("keeps paging while full pages come back, so the 1000-row cap does not truncate", async () => {
    const rows = Array.from({ length: 25 }, (_, i) => ({ id: i }));
    const { chain, calls } = createTable(rows, { pageSize: 10 });

    const result = await fetchAllRows(() => chain.select(), 10);

    expect(result).toHaveLength(25);
    expect(result.at(-1)).toEqual({ id: 24 });
    expect(calls).toEqual([
      [0, 9],
      [10, 19],
      [20, 29],
    ]);
  });

  it("stops at an exact multiple of the page size", async () => {
    const rows = Array.from({ length: 20 }, (_, i) => ({ id: i }));
    const { chain, calls } = createTable(rows, { pageSize: 10 });

    expect(await fetchAllRows(() => chain.select(), 10)).toHaveLength(20);
    // 20件目でぴったり終わるので、空を確認する3回目が要る
    expect(calls).toHaveLength(3);
  });

  it("stops and keeps what it has when a page errors", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { chain } = createTable([], { error: { message: "boom" } });

    expect(await fetchAllRows(() => chain.select())).toEqual([]);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

describe("fetchMentorDirectory", () => {
  let supabase;

  beforeEach(() => {
    supabase = createSupabase({
      public_mentors: createTable([
        { id: "m1", name: "A", icon: null },
        { id: "m2", name: "B", icon: "b.png" },
      ]),
      tags: createTable([{ id: 1, name: "文系" }]),
      mentor_tags: createTable([
        { mentor_id: "m1", tag_id: 1 },
        { mentor_id: "m2", tag_id: 1 },
        // public_mentorsに出てこない非公開メンターの行
        { mentor_id: "hidden", tag_id: 1 },
      ]),
      review_sum: createTable([{ mentor_id: "m2", star_avg: 4 }]),
    });
  });

  it("issues one query per table regardless of how many mentors there are", async () => {
    await fetchMentorDirectory(supabase);

    // 4テーブル × 1ページ (メンター数に比例して増えない)
    expect(supabase.from).toHaveBeenCalledTimes(4);
  });

  it("groups mentor_tags by mentor id", async () => {
    const { mentorTagsMap } = await fetchMentorDirectory(supabase);

    expect(mentorTagsMap.m1).toEqual([{ tag_id: 1 }]);
    expect(mentorTagsMap.m2).toEqual([{ tag_id: 1 }]);
  });

  it("drops tag rows belonging to mentors outside public_mentors", async () => {
    const { mentorTagsMap } = await fetchMentorDirectory(supabase);

    expect(mentorTagsMap.hidden).toBeUndefined();
    expect(Object.keys(mentorTagsMap)).toEqual(["m1", "m2"]);
  });

  it("attaches the review average, defaulting to 0", async () => {
    const { mentors } = await fetchMentorDirectory(supabase);

    expect(mentors.find((m) => m.id === "m2").review_sum).toBe(4);
    expect(mentors.find((m) => m.id === "m1").review_sum).toBe(0);
  });

  it("puts mentors with an icon first", async () => {
    const { mentors } = await fetchMentorDirectory(supabase);

    expect(mentors.map((m) => m.id)).toEqual(["m2", "m1"]);
  });

  it("returns empty collections when nothing is visible", async () => {
    const empty = createSupabase({});
    const { mentors, tags, mentorTagsMap } = await fetchMentorDirectory(empty);

    expect(mentors).toEqual([]);
    expect(tags).toEqual([]);
    expect(mentorTagsMap).toEqual({});
  });
});
