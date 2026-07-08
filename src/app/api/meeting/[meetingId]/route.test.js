import { describe, it, expect, vi, beforeEach } from "vitest";
import { createChain } from "@/test/supabaseMock";

const { supabaseAdminMock } = vi.hoisted(() => ({ supabaseAdminMock: { from: vi.fn() } }));
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => supabaseAdminMock),
}));

import { PATCH } from "./route";

function makeRequest({ apiKey = "route-secret", body = {} } = {}) {
  return {
    headers: { get: vi.fn(() => apiKey) },
    json: vi.fn(async () => body),
  };
}

const params = (meetingId = "meeting-1") => ({ params: Promise.resolve({ meetingId }) });

beforeEach(() => {
  vi.stubEnv("NEXT_APIROUTE_SECRET", "route-secret");
});

describe("PATCH /api/meeting/[meetingId]", () => {
  it("rejects requests with a wrong or missing x-api-key", async () => {
    const res = await PATCH(makeRequest({ apiKey: "wrong" }), params());

    expect(res.status).toBe(401);
    expect(supabaseAdminMock.from).not.toHaveBeenCalled();
  });

  it("rejects an unknown action", async () => {
    const res = await PATCH(makeRequest({ body: { action: "bogus" } }), params());

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid action" });
  });

  it("set_schedule commits the given date/time", async () => {
    const chain = createChain({ data: { meeting_id: "meeting-1" }, error: null });
    supabaseAdminMock.from.mockReturnValue(chain);

    const res = await PATCH(
      makeRequest({ body: { action: "set_schedule", date: "2026-07-10", time: "10:00" } }),
      params("meeting-1"),
    );

    expect(res.status).toBe(200);
    expect(chain.update).toHaveBeenCalledWith({ date: "2026-07-10", time: "10:00", is_commit: true });
    expect(chain.eq).toHaveBeenCalledWith("meeting_id", "meeting-1");
  });

  it("delete_schedule clears date/time and uncommits", async () => {
    const chain = createChain({ data: {}, error: null });
    supabaseAdminMock.from.mockReturnValue(chain);

    await PATCH(makeRequest({ body: { action: "delete_schedule" } }), params());

    expect(chain.update).toHaveBeenCalledWith({ date: null, time: null, is_commit: false });
  });

  it("finish marks the meeting schedule as finished", async () => {
    const chain = createChain({ data: {}, error: null });
    supabaseAdminMock.from.mockReturnValue(chain);

    await PATCH(makeRequest({ body: { action: "finish" } }), params());

    expect(chain.update).toHaveBeenCalledWith({ is_finished: true });
  });

  it("returns 500 when the update fails", async () => {
    const chain = createChain({ data: null, error: { message: "db error" } });
    supabaseAdminMock.from.mockReturnValue(chain);

    const res = await PATCH(makeRequest({ body: { action: "finish" } }), params());

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "db error" });
  });
});
