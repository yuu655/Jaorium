import { describe, it, expect, vi } from "vitest";
import { createSupabaseMock } from "@/test/supabaseMock";

vi.mock("@supabase/ssr", () => ({ createServerClient: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn() }));
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ getAll: () => [], set: vi.fn() })),
}));

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { DELETE } from "./route";

describe("DELETE /api/auth/delete-account", () => {
  it("rejects unauthenticated requests without touching the admin client", async () => {
    createServerClient.mockReturnValue(
      createSupabaseMock({ auth: { getUser: vi.fn(async () => ({ data: { user: null }, error: null })) } }),
    );
    const deleteUser = vi.fn();
    createClient.mockReturnValue(createSupabaseMock({ auth: { admin: { deleteUser } } }));

    const res = await DELETE();

    expect(res.status).toBe(401);
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it("deletes the signed-in user's own account via the admin client", async () => {
    createServerClient.mockReturnValue(
      createSupabaseMock({
        auth: { getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } }, error: null })) },
      }),
    );
    const deleteUser = vi.fn(async () => ({ error: null }));
    createClient.mockReturnValue(createSupabaseMock({ auth: { admin: { deleteUser } } }));

    const res = await DELETE();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(deleteUser).toHaveBeenCalledWith("user-1");
  });

  it("returns 500 when deletion fails", async () => {
    createServerClient.mockReturnValue(
      createSupabaseMock({
        auth: { getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } }, error: null })) },
      }),
    );
    createClient.mockReturnValue(
      createSupabaseMock({
        auth: { admin: { deleteUser: vi.fn(async () => ({ error: { message: "boom" } })) } },
      }),
    );

    const res = await DELETE();

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "boom" });
  });
});
