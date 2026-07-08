import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import getBaseUrl from "./getUrls";

describe("getBaseUrl", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.NEXT_PUBLIC_VERCEL_URL;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("prefers NEXT_PUBLIC_APP_URL when set", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://www.jaorium.com";
    process.env.NEXT_PUBLIC_VERCEL_URL = "some-preview.vercel.app";

    expect(getBaseUrl()).toBe("https://www.jaorium.com");
  });

  it("falls back to NEXT_PUBLIC_VERCEL_URL, prefixed with https://", () => {
    process.env.NEXT_PUBLIC_VERCEL_URL = "some-preview.vercel.app";

    expect(getBaseUrl()).toBe("https://some-preview.vercel.app");
  });

  it("falls back to localhost when nothing is set", () => {
    expect(getBaseUrl()).toBe("http://localhost:3000");
  });
});
