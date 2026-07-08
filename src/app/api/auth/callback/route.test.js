import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@supabase/ssr", () => ({ createServerClient: vi.fn() }));
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ getAll: () => [], set: vi.fn() })),
}));
vi.mock("@/utils/getUrls", () => ({ default: vi.fn(() => "https://www.jaorium.com") }));

import { createServerClient } from "@supabase/ssr";
import { GET } from "./route";

function makeRequest(query) {
  return { url: `https://www.jaorium.com/api/auth/callback${query}` };
}

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
});

describe("GET /api/auth/callback", () => {
  it("redirects to /setAccount by default when there's no code", async () => {
    const res = await GET(makeRequest(""));

    expect(res.headers.get("location")).toBe("https://www.jaorium.com/setAccount");
  });

  it("exchanges the code and redirects to the requested next path on success", async () => {
    createServerClient.mockReturnValue({
      auth: {
        exchangeCodeForSession: vi.fn(async () => ({
          data: { user: { app_metadata: {} } },
          error: null,
        })),
      },
    });

    const res = await GET(makeRequest("?code=abc123&next=/setAccount/user"));

    expect(res.headers.get("location")).toBe("https://www.jaorium.com/setAccount/user");
  });

  it("throws when the code exchange fails", async () => {
    const exchangeError = new Error("bad code");
    createServerClient.mockReturnValue({
      auth: { exchangeCodeForSession: vi.fn(async () => ({ data: {}, error: exchangeError })) },
    });

    await expect(GET(makeRequest("?code=expired"))).rejects.toThrow("bad code");
  });
});
