import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseMock, createChain } from "@/test/supabaseMock";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { saveMeetingAdvice } from "./actions";

function mockSession({
  user = { id: "mentor-1" },
  meeting = { id: "meeting-1", mentor: "mentor-1" },
  schedule = { is_finished: false },
  adviceChain = createChain({ error: null }),
} = {}) {
  createClient.mockResolvedValue(
    createSupabaseMock({
      auth: { getUser: vi.fn(async () => ({ data: { user } })) },
      from: {
        meetings: () => createChain({ data: meeting, error: null }),
        meeting_schedules: () => createChain({ data: schedule, error: null }),
        meeting_advices: () => adviceChain,
      },
    }),
  );
  return adviceChain;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("saveMeetingAdvice", () => {
  it("rejects unauthenticated callers", async () => {
    mockSession({ user: null });
    expect(await saveMeetingAdvice("meeting-1", ["a"])).toEqual({ error: "ログインが必要です。" });
  });

  it("rejects a mentor who is not this meeting's mentor", async () => {
    const chain = mockSession({ user: { id: "mentor-2" } });

    expect(await saveMeetingAdvice("meeting-1", ["a"])).toEqual({ error: "権限がありません。" });
    expect(chain.upsert).not.toHaveBeenCalled();
  });

  it("rejects edits after the meeting has finished", async () => {
    const chain = mockSession({ schedule: { is_finished: true } });

    const result = await saveMeetingAdvice("meeting-1", ["a"]);

    expect(result.error).toBe("終了した面談のアドバイスは編集できません。");
    expect(chain.upsert).not.toHaveBeenCalled();
  });

  it("rejects more than 3 items", async () => {
    const chain = mockSession();

    const result = await saveMeetingAdvice("meeting-1", ["a", "b", "c", "d"]);

    expect(result.error).toBeDefined();
    expect(chain.upsert).not.toHaveBeenCalled();
  });

  it("rejects saving with every field empty (the chat gate needs at least one item)", async () => {
    const chain = mockSession();

    const result = await saveMeetingAdvice("meeting-1", ["", " ", ""]);

    expect(result).toEqual({ error: "アドバイスを1つ以上入力してください。" });
    expect(chain.upsert).not.toHaveBeenCalled();
  });

  it("upserts trimmed, non-empty items keyed by meeting_id", async () => {
    const chain = mockSession();

    const result = await saveMeetingAdvice("meeting-1", ["", " 基礎を固める ", "過去問"]);

    expect(result).toEqual({ success: true, items: ["基礎を固める", "過去問"] });
    expect(chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        meeting_id: "meeting-1",
        mentor_id: "mentor-1",
        items: ["基礎を固める", "過去問"],
      }),
      { onConflict: "meeting_id" },
    );
  });

  it("surfaces a generic error when the upsert fails", async () => {
    mockSession({ adviceChain: createChain({ error: { message: "boom" } }) });

    expect(await saveMeetingAdvice("meeting-1", ["a"])).toEqual({
      error: "アドバイスの保存に失敗しました。",
    });
  });
});
