import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";

beforeEach(() => {
  vi.stubEnv("API_URL", "https://example.microcms.io/api/v1/");
  vi.stubEnv("API_KEY", "test-key");
});

describe("GET /api/article", () => {
  it("fetches blogs from microCMS with the API key header and returns the JSON body", async () => {
    const articlesPayload = { contents: [{ id: "1", title: "hello" }] };
    global.fetch = vi.fn(async () => ({ json: async () => articlesPayload }));

    const res = await GET();

    expect(global.fetch).toHaveBeenCalledWith("https://example.microcms.io/api/v1/blogs", {
      headers: { "X-MICROCMS-API-KEY": "test-key" },
    });
    expect(await res.json()).toEqual(articlesPayload);
  });
});
