import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseMock, createChain } from "@/test/supabaseMock";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/utils/getUrls", () => ({ default: vi.fn(() => "https://www.jaorium.com") }));

import { createClient } from "@/lib/supabase/server";
import { revalidateTag } from "next/cache";
import { submitReview } from "./actions";

function formData(fields) {
  const map = new Map(Object.entries(fields));
  return { get: (key) => map.get(key) ?? null };
}

const meeting = { id: "meeting-1", user: "user-1", mentor: "mentor-1" };

beforeEach(() => {
  vi.stubEnv("NEXT_APIROUTE_SECRET", "route-secret");
  vi.spyOn(console, "log").mockImplementation(() => {});
  global.fetch = vi.fn(async () => ({ ok: true }));
});

describe("submitReview server action", () => {
  it("requires comments", async () => {
    const result = await submitReview("meeting-1", null, formData({ stars: "5" }));
    expect(result).toEqual({ error: "レビュー内容を入力してください" });
  });

  it("requires stars", async () => {
    const result = await submitReview("meeting-1", null, formData({ comments: "great" }));
    expect(result).toEqual({ error: "評価を入力してください" });
  });

  it("rejects stars outside the 1-5 range, before touching Supabase", async () => {
    const result = await submitReview("meeting-1", null, formData({ comments: "great", stars: "9" }));
    expect(result).toEqual({ error: "評価は1〜5の範囲で選択してください" });
  });

  it("requires authentication", async () => {
    createClient.mockResolvedValue(
      createSupabaseMock({ auth: { getUser: vi.fn(async () => ({ data: { user: null } })) } }),
    );

    const result = await submitReview("meeting-1", null, formData({ comments: "great", stars: "5" }));

    expect(result).toEqual({ error: "ログインが必要です" });
  });

  it("rejects when a review already exists for the meeting", async () => {
    createClient.mockResolvedValue(
      createSupabaseMock({
        auth: { getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } })) },
        from: {
          meetings: () => createChain({ data: meeting, error: null }),
          reviews: () => createChain({ data: { id: "existing-review" }, error: null }),
        },
      }),
    );

    const result = await submitReview("meeting-1", null, formData({ comments: "great", stars: "5" }));

    expect(result).toEqual({ error: "このミーティングに対するレビューは既に存在します" });
  });

  it("rejects when the caller isn't the meeting's own user", async () => {
    createClient.mockResolvedValue(
      createSupabaseMock({
        auth: { getUser: vi.fn(async () => ({ data: { user: { id: "someone-else" } } })) },
        from: {
          meetings: () => createChain({ data: meeting, error: null }),
          reviews: () => createChain({ data: null, error: null }),
        },
      }),
    );

    const result = await submitReview("meeting-1", null, formData({ comments: "great", stars: "5" }));

    expect(result).toEqual({ error: "このミーティングに対するレビューを作成する権限がありません" });
  });

  it("returns the finish-meeting API's own error message when that call fails", async () => {
    createClient.mockResolvedValue(
      createSupabaseMock({
        auth: { getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } })) },
        from: {
          meetings: () => createChain({ data: meeting, error: null }),
          reviews: () => createChain({ data: null, error: null }),
        },
      }),
    );
    global.fetch = vi.fn(async () => ({
      ok: false,
      json: async () => ({ error: "Invalid action" }),
    }));

    const result = await submitReview("meeting-1", null, formData({ comments: "great", stars: "5" }));

    expect(result).toEqual({ error: "Invalid action" });
  });

  it("falls back to a generic error when the finish-meeting API response isn't valid JSON", async () => {
    createClient.mockResolvedValue(
      createSupabaseMock({
        auth: { getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } })) },
        from: {
          meetings: () => createChain({ data: meeting, error: null }),
          reviews: () => createChain({ data: null, error: null }),
        },
      }),
    );
    global.fetch = vi.fn(async () => ({
      ok: false,
      json: async () => {
        throw new Error("not json");
      },
    }));

    const result = await submitReview("meeting-1", null, formData({ comments: "great", stars: "5" }));

    expect(result).toEqual({ error: "エラーが発生しました" });
  });

  it("returns an error when the review insert fails", async () => {
    createClient.mockResolvedValue(
      createSupabaseMock({
        auth: { getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } })) },
        from: {
          meetings: () => createChain({ data: meeting, error: null }),
          reviews: () => createChain({ data: null, error: { message: "insert failed" } }),
        },
      }),
    );

    const result = await submitReview("meeting-1", null, formData({ comments: "great", stars: "5" }));

    expect(result).toEqual({ error: "レビューの作成に失敗しました" });
  });

  it("revalidates both dashboards and redirects on a fully successful submission", async () => {
    createClient.mockResolvedValue(
      createSupabaseMock({
        auth: { getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } })) },
        from: {
          meetings: () => createChain({ data: meeting, error: null }),
          reviews: () => createChain({ data: null, error: null }),
        },
      }),
    );

    await expect(
      submitReview("meeting-1", null, formData({ comments: "great", stars: "5" })),
    ).rejects.toThrow("REDIRECT:/dashboard/");

    expect(revalidateTag).toHaveBeenCalledWith("dashboard-user-user-1");
    expect(revalidateTag).toHaveBeenCalledWith("dashboard-mentor-mentor-1");
  });
});
