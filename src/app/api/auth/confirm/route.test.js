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

  // token_hash方式: PKCEのcode_verifierクッキーが不要なため、
  // 登録時と別の端末・ブラウザでメールのリンクを開いても認証できる
  it("verifies a token_hash and redirects to next on success", async () => {
    const verifyOtp = vi.fn(async () => ({ error: null }));
    createClient.mockResolvedValue({ auth: { verifyOtp } });

    const res = await GET(
      makeRequest("?token_hash=hash123&type=email&next=/setAccount/user"),
    );

    expect(verifyOtp).toHaveBeenCalledWith({ token_hash: "hash123", type: "email" });
    expect(res.headers.get("location")).toBe("https://www.jaorium.com/setAccount/user");
  });

  it("redirects to /error when token_hash verification fails", async () => {
    createClient.mockResolvedValue({
      auth: { verifyOtp: vi.fn(async () => ({ error: { message: "expired" } })) },
    });

    const res = await GET(makeRequest("?token_hash=used&type=email&next=/setAccount/user"));

    expect(res.headers.get("location")).toBe("https://www.jaorium.com/error");
  });
});
