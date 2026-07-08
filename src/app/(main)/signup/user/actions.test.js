import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn() }));
vi.mock("@/utils/getUrls", () => ({ default: vi.fn(() => "https://www.jaorium.com") }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { signupUser, signupMentor, handleVerifyOtp } from "./actions";

function formData(fields) {
  const map = new Map(Object.entries(fields));
  return { get: (key) => map.get(key) ?? null };
}

describe("signupUser server action (OTP-based, on the /signup/user page)", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("blocks signup when the email already exists", async () => {
    createSupabaseClient.mockReturnValue({ rpc: vi.fn(async () => ({ data: true, error: null })) });
    createClient.mockResolvedValue({ auth: { signInWithOtp: vi.fn() } });

    const result = await signupUser(null, formData({ email: "existing@example.com" }));

    expect(result).toEqual({
      success: false,
      error: "このメールアドレスは既に登録されています。",
    });
  });

  it("sends a magic-link OTP redirecting to /setAccount/user for a new email", async () => {
    const signInWithOtp = vi.fn(async () => ({ error: null }));
    createSupabaseClient.mockReturnValue({ rpc: vi.fn(async () => ({ data: false, error: null })) });
    createClient.mockResolvedValue({ auth: { signInWithOtp } });

    const result = await signupUser(null, formData({ email: "new@example.com" }));

    expect(result).toEqual({ success: true });
    expect(signInWithOtp).toHaveBeenCalledWith({
      email: "new@example.com",
      options: {
        shouldCreateUser: true,
        emailRedirectTo: "https://www.jaorium.com/api/auth/confirm?next=/setAccount/user",
      },
    });
  });
});

describe("signupMentor server action (on the /signup/user page)", () => {
  // Known bug found during test-writing (separate from the three previously fixed): this
  // function is meant to sign a *mentor* up, but it unconditionally calls
  // `auth.updateUser({ data: { role: "user" } })` - it stamps the new account's
  // user_metadata.role as "user", not "mentor". Left unfixed for now (out of the
  // originally-approved scope); documented here so it isn't lost.
  it("[known bug] stamps role=\"user\" on user_metadata even though this signs up a mentor", async () => {
    const updateUser = vi.fn(async () => ({ error: null }));
    createClient.mockResolvedValue({
      auth: { signUp: vi.fn(async () => ({ error: null })), updateUser },
    });

    await signupMentor(
      null,
      formData({ email: "mentor@example.com", password: "secret1", password_check: "secret1" }),
    );

    expect(updateUser).toHaveBeenCalledWith({ data: { role: "user" } });
  });

  it("still reports success when signUp succeeds", async () => {
    createClient.mockResolvedValue({
      auth: {
        signUp: vi.fn(async () => ({ error: null })),
        updateUser: vi.fn(async () => ({ error: null })),
      },
    });

    const result = await signupMentor(
      null,
      formData({ email: "mentor@example.com", password: "secret1", password_check: "secret1" }),
    );

    expect(result).toEqual({ success: true });
  });

  it("surfaces a signUp error", async () => {
    createClient.mockResolvedValue({
      auth: {
        signUp: vi.fn(async () => ({ error: { message: "email taken" } })),
        updateUser: vi.fn(async () => ({ error: null })),
      },
    });

    const result = await signupMentor(
      null,
      formData({ email: "mentor@example.com", password: "secret1", password_check: "secret1" }),
    );

    expect(result).toEqual({ error: "サインアップに失敗しました: email taken" });
  });
});

describe("handleVerifyOtp server action (on the /signup/user page)", () => {
  it("requires both token and email", async () => {
    createClient.mockResolvedValue({ auth: { verifyOtp: vi.fn() } });

    const result = await handleVerifyOtp(null, formData({ email: "a@example.com" }));

    expect(result).toEqual({ success: false, error: "コードを入力してください。" });
  });

  it("redirects to /setAccount/user on success", async () => {
    createClient.mockResolvedValue({
      auth: { verifyOtp: vi.fn(async () => ({ data: {}, error: null })) },
    });

    await expect(
      handleVerifyOtp(null, formData({ token: "123456", email: "a@example.com" })),
    ).rejects.toThrow("REDIRECT:/setAccount/user");
  });

  it("translates an invalid-code error into a Japanese message", async () => {
    createClient.mockResolvedValue({
      auth: {
        verifyOtp: vi.fn(async () => ({ data: null, error: { message: "Token is invalid" } })),
      },
    });

    const result = await handleVerifyOtp(null, formData({ token: "000000", email: "a@example.com" }));

    expect(result).toEqual({ success: false, error: "コードが正しくありません。" });
  });
});
