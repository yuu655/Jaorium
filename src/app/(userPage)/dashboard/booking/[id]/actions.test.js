import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseMock, createChain } from "@/test/supabaseMock";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/utils/getUrls", () => ({ default: vi.fn(() => "https://www.jaorium.com") }));

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn(async () => ({})) }));
vi.mock("resend", () => ({
  Resend: vi.fn(function Resend() {
    this.emails = { send: sendMock };
  }),
}));

import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";
import { submitBooking } from "./actions";

function formData(fields) {
  const map = new Map(Object.entries(fields));
  return { get: (key) => map.get(key) ?? null };
}

const validFields = {
  title: "受験相談",
  description: "詳細です",
  trouble_episode: "つまずいた話",
  actions_taken: "やったこと",
  unresolved_issues: "未解決の課題",
  desired_outcome: "相談したいこと",
};

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  sendMock.mockClear();
});

describe("submitBooking server action", () => {
  it("requires a title", async () => {
    const result = await submitBooking("mentor-1", null, formData({}));

    expect(result).toEqual({ error: "相談内容を選択してください" });
  });

  it("requires authentication", async () => {
    createClient.mockResolvedValue(
      createSupabaseMock({ auth: { getUser: vi.fn(async () => ({ data: { user: null } })) } }),
    );

    const result = await submitBooking("mentor-1", null, formData(validFields));

    expect(result).toEqual({ error: "ログインが必要です" });
  });

  it("rejects a caller whose profiles.role isn't \"user\"", async () => {
    createClient.mockResolvedValue(
      createSupabaseMock({
        auth: {
          getUser: vi.fn(async () => ({ data: { user: { id: "u1" } } })),
        },
        from: { profiles: () => createChain({ data: { role: "mentor" }, error: null }) },
      }),
    );

    const result = await submitBooking("mentor-1", null, formData(validFields));

    expect(result).toEqual({ error: "権限がありません" });
  });

  // 現行のOTPサインアップではuser_metadata.roleが設定されないため、
  // roleの判定はuser_metadataではなくprofilesテーブルを正とする(回帰テスト)
  it("rejects a caller with no profiles row even if user_metadata claims role user", async () => {
    createClient.mockResolvedValue(
      createSupabaseMock({
        auth: {
          getUser: vi.fn(async () => ({
            data: { user: { id: "u1", user_metadata: { role: "user" } } },
          })),
        },
        from: { profiles: () => createChain({ data: null, error: null }) },
      }),
    );

    const result = await submitBooking("mentor-1", null, formData(validFields));

    expect(result).toEqual({ error: "権限がありません" });
  });

  it("rejects a nonexistent mentor", async () => {
    createClient.mockResolvedValue(
      createSupabaseMock({
        auth: {
          getUser: vi.fn(async () => ({ data: { user: { id: "u1" } } })),
        },
        from: {
          profiles: () => createChain({ data: { role: "user" }, error: null }),
          mentors: () => createChain({ data: null, error: null }),
        },
      }),
    );

    const result = await submitBooking("mentor-1", null, formData(validFields));

    expect(result).toEqual({ error: "メンターが存在しません" });
  });

  it("returns an error when the meeting insert fails, without sending any email", async () => {
    createSupabaseClient.mockReturnValue(
      createSupabaseMock({
        auth: { admin: { getUserById: vi.fn(async () => ({ data: { user: { email: "mentor@example.com" } } })) } },
      }),
    );
    createClient.mockResolvedValue(
      createSupabaseMock({
        auth: {
          getUser: vi.fn(async () => ({ data: { user: { id: "u1" } } })),
        },
        from: {
          profiles: () => createChain({ data: { role: "user" }, error: null }),
          mentors: () => createChain({ data: { id: "mentor-1" }, error: null }),
          meetings: () => createChain({ data: null, error: { message: "insert failed" } }),
        },
      }),
    );

    const result = await submitBooking("mentor-1", null, formData(validFields));

    expect(result).toEqual({ error: "予約の作成に失敗しました" });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("creates the meeting, emails both parties, revalidates both dashboards, and redirects to the chat", async () => {
    createSupabaseClient.mockReturnValue(
      createSupabaseMock({
        auth: { admin: { getUserById: vi.fn(async () => ({ data: { user: { email: "mentor@example.com" } } })) } },
      }),
    );
    createClient.mockResolvedValue(
      createSupabaseMock({
        auth: {
          getUser: vi.fn(async () => ({
            data: { user: { id: "u1", email: "user@example.com" } },
          })),
        },
        from: {
          profiles: () => createChain({ data: { role: "user" }, error: null }),
          mentors: () => createChain({ data: { id: "mentor-1" }, error: null }),
          meetings: () => createChain({ data: [{ id: "meeting-1" }], error: null }),
        },
      }),
    );

    await expect(submitBooking("mentor-1", null, formData(validFields))).rejects.toThrow(
      "REDIRECT:/dashboard/chat/meeting-1",
    );

    expect(sendMock).toHaveBeenCalledTimes(2);
    expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({ to: "mentor@example.com" }));
    expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({ to: "user@example.com" }));
    expect(revalidateTag).toHaveBeenCalledWith("dashboard-user-u1");
    expect(revalidateTag).toHaveBeenCalledWith("dashboard-mentor-mentor-1");
  });
});
