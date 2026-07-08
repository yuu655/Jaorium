import { describe, it, expect, vi } from "vitest";
import { createSupabaseMock, createChain } from "@/test/supabaseMock";

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(),
}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ getAll: () => [], set: vi.fn() })),
}));

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { POST } from "./route";

function makeRequest(mentorId = "mentor-1") {
  return { url: `https://example.com/api/mentor?id=${mentorId}` };
}

function mockSession({ user, role }) {
  createServerClient.mockReturnValue(
    createSupabaseMock({
      auth: { getUser: vi.fn(async () => ({ data: { user }, error: null })) },
      from: { profiles: () => createChain({ data: user ? { role } : null, error: null }) },
    }),
  );
}

describe("POST /api/mentor (mentor approval)", () => {
  it("rejects unauthenticated requests", async () => {
    mockSession({ user: null, role: undefined });
    createClient.mockReturnValue(createSupabaseMock());

    const res = await POST(makeRequest());

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
  });

  it("rejects a signed-in user whose profiles.role is not admin", async () => {
    mockSession({ user: { id: "user-1" }, role: "mentor" });
    createClient.mockReturnValue(createSupabaseMock());

    const res = await POST(makeRequest());

    expect(res.status).toBe(401);
  });

  it("approves the mentor when the caller's profiles.role is admin", async () => {
    mockSession({ user: { id: "admin-1" }, role: "admin" });
    const mentorsChain = createChain({ error: null });
    createClient.mockReturnValue(createSupabaseMock({ from: { mentors: () => mentorsChain } }));

    const res = await POST(makeRequest("mentor-42"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(mentorsChain.update).toHaveBeenCalledWith({ is_allowed: true });
    expect(mentorsChain.eq).toHaveBeenCalledWith("id", "mentor-42");
  });

  it("returns 500 when the mentors update fails", async () => {
    mockSession({ user: { id: "admin-1" }, role: "admin" });
    createClient.mockReturnValue(
      createSupabaseMock({
        from: { mentors: () => createChain({ error: { message: "db error" } }) },
      }),
    );

    const res = await POST(makeRequest());

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "db error" });
  });
});
