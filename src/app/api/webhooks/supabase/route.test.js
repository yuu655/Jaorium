import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

import { revalidateTag } from "next/cache";
import { POST } from "./route";

function makeRequest(body, secret = "webhook-secret") {
  return {
    headers: { get: vi.fn(() => secret) },
    json: vi.fn(async () => body),
  };
}

beforeEach(() => {
  vi.stubEnv("SUPABASE_WEBHOOK_SECRET", "webhook-secret");
});

describe("POST /api/webhooks/supabase", () => {
  it("rejects a request with the wrong secret", async () => {
    const res = await POST(makeRequest({ table: "mentors" }, "wrong"));

    expect(res.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("revalidates the mentors tag when the mentors table changes", async () => {
    const res = await POST(makeRequest({ table: "mentors" }));

    expect(revalidateTag).toHaveBeenCalledWith("mentors");
    expect(await res.json()).toEqual({ revalidated: true });
  });

  it("does nothing for an unrecognized table", async () => {
    await POST(makeRequest({ table: "unknown_table" }));

    expect(revalidateTag).not.toHaveBeenCalled();
  });
});
