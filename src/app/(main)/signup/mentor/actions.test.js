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

describe("signupUser server action (password-based signup)", () => {
  it("rejects a mismatched password/password_check pair without calling signUp", async () => {
    const signUp = vi.fn(async () => ({ error: null }));
    createClient.mockResolvedValue({ auth: { signUp } });

    const result = await signupUser(
      null,
      formData({ email: "a@example.com", password: "secret1", password_check: "totally-different" }),
    );

    expect(signUp).not.toHaveBeenCalled();
    expect(result).toEqual({ error: "再入力のパスワードと一致しません" });
  });

  it("proceeds to signUp when password and password_check match", async () => {
    const signUp = vi.fn(async () => ({ error: null }));
    createClient.mockResolvedValue({ auth: { signUp } });

    const result = await signupUser(
      null,
      formData({ email: "a@example.com", password: "secret1", password_check: "secret1" }),
    );

    expect(signUp).toHaveBeenCalled();
    expect(result).toEqual({ success: true });
  });

  it("surfaces a Supabase signUp error", async () => {
    const signUp = vi.fn(async () => ({ error: { message: "email taken" } }));
    createClient.mockResolvedValue({ auth: { signUp } });

    const result = await signupUser(
      null,
      formData({ email: "a@example.com", password: "x", password_check: "x" }),
    );

    expect(result).toEqual({ error: "サインアップに失敗しました: email taken" });
  });
});

describe("signupMentor server action (OTP-based signup)", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("blocks signup when the email already exists", async () => {
    createSupabaseClient.mockReturnValue({
      rpc: vi.fn(async () => ({ data: true, error: null })),
    });
    createClient.mockResolvedValue({ auth: { signInWithOtp: vi.fn() } });

    const result = await signupMentor(null, formData({ email: "existing@example.com" }));

    expect(result).toEqual({
      success: false,
      error: "このメールアドレスは既に登録されています。",
    });
  });

  it("returns a generic error when the email_exists RPC itself fails", async () => {
    createSupabaseClient.mockReturnValue({
      rpc: vi.fn(async () => ({ data: null, error: { message: "rpc down" } })),
    });
    createClient.mockResolvedValue({ auth: { signInWithOtp: vi.fn() } });

    const result = await signupMentor(null, formData({ email: "a@example.com" }));

    expect(result).toEqual({ success: false, error: "確認に失敗しました。" });
  });

  it("sends a magic-link OTP with the mentor onboarding redirect when the email is new", async () => {
    const signInWithOtp = vi.fn(async () => ({ error: null }));
    createSupabaseClient.mockReturnValue({ rpc: vi.fn(async () => ({ data: false, error: null })) });
    createClient.mockResolvedValue({ auth: { signInWithOtp } });

    const result = await signupMentor(null, formData({ email: "new@example.com" }));

    expect(result).toEqual({ success: true });
    expect(signInWithOtp).toHaveBeenCalledWith({
      email: "new@example.com",
      options: {
        shouldCreateUser: true,
        emailRedirectTo: "https://www.jaorium.com/api/auth/confirm?next=/setAccount/mentor",
      },
    });
  });

  it("rejects a malformed email before any Supabase call (2026-07-15 incident pattern)", async () => {
    // GoTrueは "xxx.@gmail.com" を通してしまいSMTP送信で500になるため、事前に弾く
    const rpc = vi.fn();
    const signInWithOtp = vi.fn();
    createSupabaseClient.mockReturnValue({ rpc });
    createClient.mockResolvedValue({ auth: { signInWithOtp } });

    const result = await signupMentor(
      null,
      formData({ email: "yukidaruma.mkzk.@gmail.com" }),
    );

    expect(result).toEqual({
      success: false,
      error: "メールアドレスの形式が正しくありません。入力内容をご確認ください。",
    });
    expect(rpc).not.toHaveBeenCalled();
    expect(signInWithOtp).not.toHaveBeenCalled();
  });

  it("returns a friendly message (without the raw error) when the OTP email fails to send", async () => {
    createSupabaseClient.mockReturnValue({ rpc: vi.fn(async () => ({ data: false, error: null })) });
    createClient.mockResolvedValue({
      auth: {
        signInWithOtp: vi.fn(async () => ({ error: { message: "Error sending magic link email" } })),
      },
    });

    const result = await signupMentor(null, formData({ email: "new@example.com" }));

    expect(result).toEqual({
      error:
        "確認メールを送信できませんでした。メールアドレスに誤りがないかご確認のうえ、もう一度お試しください。",
    });
  });
});

describe("handleVerifyOtp server action", () => {
  it("requires both token and email", async () => {
    createClient.mockResolvedValue({ auth: { verifyOtp: vi.fn() } });

    const result = await handleVerifyOtp(null, formData({ email: "a@example.com" }));

    expect(result).toEqual({ success: false, error: "コードを入力してください。" });
  });

  it("redirects to /setAccount/mentor on success", async () => {
    createClient.mockResolvedValue({
      auth: { verifyOtp: vi.fn(async () => ({ data: {}, error: null })) },
    });

    await expect(
      handleVerifyOtp(null, formData({ token: "123456", email: "a@example.com" })),
    ).rejects.toThrow("REDIRECT:/setAccount/mentor");
  });

  it("translates an expired-code error into a Japanese message", async () => {
    createClient.mockResolvedValue({
      auth: {
        verifyOtp: vi.fn(async () => ({ data: null, error: { message: "Token has expired" } })),
      },
    });

    const result = await handleVerifyOtp(null, formData({ token: "000000", email: "a@example.com" }));

    expect(result).toEqual({
      success: false,
      error: "コードの有効期限が切れています。再送信してください。",
    });
  });
});
