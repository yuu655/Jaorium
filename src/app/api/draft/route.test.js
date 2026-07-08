import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));
vi.mock("next/headers", () => ({
  draftMode: vi.fn(async () => ({ enable: vi.fn() })),
  cookies: vi.fn(async () => ({ get: vi.fn(() => undefined), set: vi.fn() })),
}));

import { draftMode, cookies } from "next/headers";
import { GET } from "./route";

function makeRequest(params) {
  return { url: `https://www.jaorium.com/api/draft?${new URLSearchParams(params)}` };
}

beforeEach(() => {
  vi.stubEnv("MICROCMS_PREVIEW_SECRET", "preview-secret");
});

describe("GET /api/draft", () => {
  it("requires slug and draftKey", async () => {
    const res = await GET(makeRequest({ secret: "preview-secret" }));

    expect(res.status).toBe(400);
  });

  it("rejects an invalid secret", async () => {
    const res = await GET(makeRequest({ slug: "hello", draftKey: "k1", secret: "wrong" }));

    expect(res.status).toBe(401);
  });

  it("enables draft mode, extends the preview cookies, and redirects to the article preview", async () => {
    const enable = vi.fn();
    draftMode.mockResolvedValue({ enable });
    const set = vi.fn();
    cookies.mockResolvedValue({
      get: vi.fn((name) => (name === "__prerender_bypass" ? { value: "bypass-token" } : undefined)),
      set,
    });

    await expect(
      GET(makeRequest({ slug: "hello", draftKey: "k1", secret: "preview-secret" })),
    ).rejects.toThrow("REDIRECT:/articles/hello?draftKey=k1");

    expect(enable).toHaveBeenCalled();
    expect(set).toHaveBeenCalledWith(
      "__prerender_bypass",
      "bypass-token",
      expect.objectContaining({ maxAge: 600 }),
    );
  });
});
