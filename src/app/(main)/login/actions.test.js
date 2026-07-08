import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { login } from "./actions";

function formData(fields) {
  const map = new Map(Object.entries(fields));
  return { get: (key) => map.get(key) ?? null };
}

describe("login server action", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("returns a friendly error message for invalid credentials", async () => {
    createClient.mockResolvedValue({
      auth: {
        signInWithPassword: vi.fn(async () => ({
          data: { user: null },
          error: { message: "Invalid login credentials" },
        })),
      },
    });

    const result = await login(null, formData({ email: "a@example.com", password: "wrong" }));

    expect(result).toEqual({
      error:
        "メールアドレスまたはパスワードが間違っています。アカウントをお持ちでない場合は新規登録してください。",
    });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("returns a generic error message for other auth errors", async () => {
    createClient.mockResolvedValue({
      auth: {
        signInWithPassword: vi.fn(async () => ({
          data: { user: null },
          error: { message: "Some other Supabase error" },
        })),
      },
    });

    const result = await login(null, formData({ email: "a@example.com", password: "x" }));

    expect(result).toEqual({ error: "ログインに失敗しました" });
  });

  it("revalidates and redirects to /dashboard on success", async () => {
    createClient.mockResolvedValue({
      auth: {
        signInWithPassword: vi.fn(async () => ({
          data: { user: { id: "user-1" } },
          error: null,
        })),
      },
    });

    await expect(
      login(null, formData({ email: "a@example.com", password: "correct" })),
    ).rejects.toThrow("REDIRECT:/dashboard");

    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });
});
