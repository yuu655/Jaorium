import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { POST } from "./route";

function makeRequest() {
  return { url: "https://www.jaorium.com/api/auth/signout" };
}

describe("POST /api/auth/signout", () => {
  it("signs the user out, revalidates the layout, and redirects to /", async () => {
    const signOut = vi.fn(async () => ({ error: null }));
    createClient.mockResolvedValue({
      auth: {
        getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } })),
        signOut,
      },
    });

    const res = await POST(makeRequest());

    expect(signOut).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(res.headers.get("location")).toBe("https://www.jaorium.com/");
  });

  it("does not call signOut when there is no signed-in user, but still redirects", async () => {
    const signOut = vi.fn();
    createClient.mockResolvedValue({
      auth: { getUser: vi.fn(async () => ({ data: { user: null } })), signOut },
    });

    const res = await POST(makeRequest());

    expect(signOut).not.toHaveBeenCalled();
    expect(res.headers.get("location")).toBe("https://www.jaorium.com/");
  });
});
