import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

import { revalidateTag } from "next/cache";
import { POST } from "./route";

function makeRequest(params) {
  return { url: `https://example.com/api/revalidate?${new URLSearchParams(params)}` };
}

beforeEach(() => {
  vi.stubEnv("MY_SECRET_TOKEN", "secret-token");
});

describe("POST /api/revalidate", () => {
  it("rejects an invalid token", async () => {
    const res = await POST(makeRequest({ secret: "wrong", tag: "mentors" }));

    expect(res.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("revalidates the given tag when the token is valid", async () => {
    const res = await POST(makeRequest({ secret: "secret-token", tag: "mentors" }));

    expect(revalidateTag).toHaveBeenCalledWith("mentors");
    expect(await res.json()).toEqual(expect.objectContaining({ revalidated: true }));
  });

  it("returns 500 if revalidateTag throws", async () => {
    revalidateTag.mockImplementationOnce(() => {
      throw new Error("boom");
    });

    const res = await POST(makeRequest({ secret: "secret-token", tag: "mentors" }));

    expect(res.status).toBe(500);
  });
});
