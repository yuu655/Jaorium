import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { resetPass } from "./actions";

function formData(fields) {
  const map = new Map(Object.entries(fields));
  return { get: (key) => map.get(key) ?? null };
}

describe("resetPass server action", () => {
  it("rejects a mismatched password/password_check pair without calling updateUser", async () => {
    const updateUser = vi.fn();
    createClient.mockResolvedValue({ auth: { updateUser } });

    const result = await resetPass(
      null,
      formData({ password: "newpass1", password_check: "different" }),
    );

    expect(result).toEqual({ error: "再入力のパスワードと一致しません" });
    expect(updateUser).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("rejects a password shorter than 6 characters without calling updateUser", async () => {
    const updateUser = vi.fn();
    createClient.mockResolvedValue({ auth: { updateUser } });

    const result = await resetPass(
      null,
      formData({ password: "abc", password_check: "abc" }),
    );

    expect(result).toEqual({ error: "パスワードは6文字以上で入力してください。" });
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("returns a session-specific message when the recovery session is missing", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    createClient.mockResolvedValue({
      auth: { updateUser: vi.fn(async () => ({ error: { message: "Auth session missing!" } })) },
    });

    const result = await resetPass(
      null,
      formData({ password: "newpass1", password_check: "newpass1" }),
    );

    expect(result).toEqual({
      error: "セッションの有効期限が切れています。もう一度パスワードリセットをやり直してください。",
    });
  });

  it("returns a friendly generic message for other updateUser failures", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    createClient.mockResolvedValue({
      auth: { updateUser: vi.fn(async () => ({ error: { message: "boom" } })) },
    });

    const result = await resetPass(
      null,
      formData({ password: "newpass1", password_check: "newpass1" }),
    );

    expect(result).toEqual({
      error: "パスワードの再設定に失敗しました。もう一度お試しください。",
    });
  });

  // 「現在のパスワードと同じ」は望む状態が既に成立しているので成功扱いにする
  it("treats a same-as-current password as success and redirects", async () => {
    createClient.mockResolvedValue({
      auth: {
        updateUser: vi.fn(async () => ({
          error: { message: "New password should be different from the old password." },
        })),
      },
    });

    await expect(
      resetPass(null, formData({ password: "newpass1", password_check: "newpass1" })),
    ).rejects.toThrow("REDIRECT:/setAccount");
  });

  it("updates the password and redirects to /setAccount on success", async () => {
    createClient.mockResolvedValue({
      auth: { updateUser: vi.fn(async () => ({ error: null })) },
    });

    await expect(
      resetPass(null, formData({ password: "newpass1", password_check: "newpass1" })),
    ).rejects.toThrow("REDIRECT:/setAccount");
  });
});
