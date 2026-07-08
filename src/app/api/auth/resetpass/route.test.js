import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@supabase/ssr", () => ({ createServerClient: vi.fn() }));
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ getAll: () => [], set: vi.fn() })),
}));
vi.mock("@/utils/getUrls", () => ({ default: vi.fn(() => "https://www.jaorium.com") }));

import { createServerClient } from "@supabase/ssr";
import { GET } from "./route";

function makeRequest(query) {
  return { url: `https://www.jaorium.com/api/auth/resetpass${query}` };
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("GET /api/auth/resetpass", () => {
  it("redirects straight to /resetPass when there's no code", async () => {
    const res = await GET(makeRequest(""));

    expect(res.headers.get("location")).toBe("https://www.jaorium.com/resetPass");
  });

  it("exchanges the code and redirects to /resetPass on success", async () => {
    createServerClient.mockReturnValue({
      auth: { exchangeCodeForSession: vi.fn(async () => ({ error: null })) },
    });

    const res = await GET(makeRequest("?code=abc123"));

    expect(res.headers.get("location")).toBe("https://www.jaorium.com/resetPass");
  });

  it("redirects to /error when the code exchange fails", async () => {
    createServerClient.mockReturnValue({
      auth: { exchangeCodeForSession: vi.fn(async () => ({ error: { message: "bad code" } })) },
    });

    const res = await GET(makeRequest("?code=expired"));

    expect(res.headers.get("location")).toBe("https://www.jaorium.com/error");
  });
});
