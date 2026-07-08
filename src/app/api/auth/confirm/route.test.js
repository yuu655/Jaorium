import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/utils/getUrls", () => ({ default: vi.fn(() => "https://www.jaorium.com") }));

import { createClient } from "@/lib/supabase/server";
import { GET } from "./route";

function makeRequest(query) {
  return { url: `https://www.jaorium.com/api/auth/confirm${query}` };
}

describe("GET /api/auth/confirm", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("redirects to /error when no code is present", async () => {
    const res = await GET(makeRequest(""));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://www.jaorium.com/error");
  });

  it("exchanges the code and redirects to the requested next path on success", async () => {
    createClient.mockResolvedValue({
      auth: { exchangeCodeForSession: vi.fn(async () => ({ error: null })) },
    });

    const res = await GET(makeRequest("?code=abc123&next=/setAccount/user"));

    expect(res.headers.get("location")).toBe("https://www.jaorium.com/setAccount/user");
  });

  it("redirects to /error when the code exchange fails", async () => {
    createClient.mockResolvedValue({
      auth: { exchangeCodeForSession: vi.fn(async () => ({ error: { message: "bad code" } })) },
    });

    const res = await GET(makeRequest("?code=expired&next=/setAccount/user"));

    expect(res.headers.get("location")).toBe("https://www.jaorium.com/error");
  });

  it("defaults next to / when omitted", async () => {
    createClient.mockResolvedValue({
      auth: { exchangeCodeForSession: vi.fn(async () => ({ error: null })) },
    });

    const res = await GET(makeRequest("?code=abc123"));

    expect(res.headers.get("location")).toBe("https://www.jaorium.com/");
  });
});
