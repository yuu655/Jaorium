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

  it("surfaces an error when updateUser fails", async () => {
    createClient.mockResolvedValue({
      auth: { updateUser: vi.fn(async () => ({ error: { message: "expired session" } })) },
    });

    const result = await resetPass(
      null,
      formData({ password: "newpass1", password_check: "newpass1" }),
    );

    expect(result).toEqual({ error: "ログインに失敗しました" });
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
