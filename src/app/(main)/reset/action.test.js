import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/utils/getUrls", () => ({ default: vi.fn(() => "https://www.jaorium.com") }));

import { createClient } from "@/lib/supabase/server";
import { resetPassword } from "./action";

function formData(fields) {
  const map = new Map(Object.entries(fields));
  return { get: (key) => map.get(key) ?? null };
}

describe("resetPassword server action", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("rejects a malformed email before calling Supabase", async () => {
    const resetPasswordForEmail = vi.fn();
    createClient.mockResolvedValue({ auth: { resetPasswordForEmail } });

    const result = await resetPassword(null, formData({ email: "broken.@gmail.com" }));

    expect(result).toEqual({
      error: "メールアドレスの形式が正しくありません。入力内容をご確認ください。",
    });
    expect(resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("returns success once the reset email has been sent", async () => {
    const resetPasswordForEmail = vi.fn(async () => ({ error: null }));
    createClient.mockResolvedValue({ auth: { resetPasswordForEmail } });

    const result = await resetPassword(null, formData({ email: "a@example.com" }));

    expect(result).toEqual({ success: true });
    expect(resetPasswordForEmail).toHaveBeenCalledWith(
      "a@example.com",
      expect.objectContaining({ redirectTo: "https://www.jaorium.com/api/auth/resetpass" }),
    );
  });

  it("returns a rate-limit specific message when Supabase reports rate limiting", async () => {
    createClient.mockResolvedValue({
      auth: {
        resetPasswordForEmail: vi.fn(async () => ({ error: { message: "rate limit exceeded" } })),
      },
    });

    const result = await resetPassword(null, formData({ email: "a@example.com" }));

    expect(result).toEqual({ error: "しばらく時間をおいてから再度お試しください" });
  });

  it("returns a generic error message for other failures", async () => {
    createClient.mockResolvedValue({
      auth: { resetPasswordForEmail: vi.fn(async () => ({ error: { message: "network down" } })) },
    });

    const result = await resetPassword(null, formData({ email: "a@example.com" }));

    expect(result).toEqual({ error: "network downメールの送信に失敗しました" });
  });
});
