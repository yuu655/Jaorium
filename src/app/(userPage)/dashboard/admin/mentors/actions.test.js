import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseMock, createChain } from "@/test/supabaseMock";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";
import { setMentorAdminAllow } from "./actions";

const ADMIN_ID = "admin-1";

function mockAdminSession({ isAdmin = true } = {}) {
  createClient.mockResolvedValue(
    createSupabaseMock({
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: ADMIN_ID } } })) },
      from: {
        profiles: () =>
          createChain({ data: { role: isAdmin ? "admin" : "user" }, error: null }),
      },
    }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("setMentorAdminAllow", () => {
  it("rejects unauthenticated callers", async () => {
    createClient.mockResolvedValue({
      auth: { getUser: vi.fn(async () => ({ data: { user: null } })) },
    });

    const result = await setMentorAdminAllow("mentor-1", true);

    expect(result).toEqual({ error: "ログインが必要です。" });
    expect(createSupabaseClient).not.toHaveBeenCalled();
  });

  it("rejects non-admin callers before touching the service-role client", async () => {
    mockAdminSession({ isAdmin: false });

    const result = await setMentorAdminAllow("mentor-1", true);

    expect(result).toEqual({ error: "権限がありません。" });
    expect(createSupabaseClient).not.toHaveBeenCalled();
  });

  it("rejects a non-boolean allow value", async () => {
    mockAdminSession();

    const result = await setMentorAdminAllow("mentor-1", "true");

    expect(result).toEqual({ error: "承認状態の指定が不正です。" });
    expect(createSupabaseClient).not.toHaveBeenCalled();
  });

  it("updates mentor_secret.admin_allow via the service-role client", async () => {
    mockAdminSession();
    const secretChain = createChain({ error: null });
    createSupabaseClient.mockReturnValue(
      createSupabaseMock({ from: { mentor_secret: () => secretChain } }),
    );

    const result = await setMentorAdminAllow("mentor-1", true);

    expect(result).toEqual({ success: true });
    expect(secretChain.update).toHaveBeenCalledWith({ admin_allow: true });
    expect(secretChain.eq).toHaveBeenCalledWith("id", "mentor-1");
  });

  it("invalidates the public mentor-list cache so the change is visible immediately", async () => {
    mockAdminSession();
    createSupabaseClient.mockReturnValue(
      createSupabaseMock({ from: { mentor_secret: () => createChain({ error: null }) } }),
    );

    await setMentorAdminAllow("mentor-1", false);

    expect(revalidateTag).toHaveBeenCalledWith("mentors");
  });

  it("surfaces a generic error when the update fails", async () => {
    mockAdminSession();
    createSupabaseClient.mockReturnValue(
      createSupabaseMock({
        from: { mentor_secret: () => createChain({ error: { message: "boom" } }) },
      }),
    );

    const result = await setMentorAdminAllow("mentor-1", true);

    expect(result).toEqual({ error: "承認状態の更新に失敗しました。" });
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});
