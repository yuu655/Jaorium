import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { setOwnerPassword } from "./actions";

function formData(fields) {
  const map = new Map(Object.entries(fields));
  return { get: (key) => map.get(key) ?? null };
}

describe("setOwnerPassword server action", () => {
  it("rejects a mismatched password/password_check pair without calling updateUser", async () => {
    const updateUser = vi.fn();
    createClient.mockResolvedValue({ auth: { updateUser } });

    const result = await setOwnerPassword(
      null,
      formData({ password: "newpass1", password_check: "different" }),
    );

    expect(result).toEqual({ error: "再入力のパスワードと一致しません。" });
    expect(updateUser).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("rejects a password shorter than 6 characters without calling updateUser", async () => {
    const updateUser = vi.fn();
    createClient.mockResolvedValue({ auth: { updateUser } });

    const result = await setOwnerPassword(null, formData({ password: "abc", password_check: "abc" }));

    expect(result).toEqual({ error: "パスワードは6文字以上で入力してください。" });
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("returns a friendly error when updateUser fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    createClient.mockResolvedValue({
      auth: { updateUser: vi.fn(async () => ({ error: { message: "boom" } })) },
    });

    const result = await setOwnerPassword(
      null,
      formData({ password: "newpass1", password_check: "newpass1" }),
    );

    expect(result).toEqual({ error: "パスワードの設定に失敗しました。もう一度お試しください。" });
  });

  it("updates the password and redirects to /dashboard/organization on success", async () => {
    createClient.mockResolvedValue({
      auth: { updateUser: vi.fn(async () => ({ error: null })) },
    });

    await expect(
      setOwnerPassword(null, formData({ password: "newpass1", password_check: "newpass1" })),
    ).rejects.toThrow("REDIRECT:/dashboard/organization");
  });
});
