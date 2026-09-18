import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@supabase/ssr", () => ({ createBrowserClient: vi.fn() }));

import { createBrowserClient } from "@supabase/ssr";

function makeBrowserClient() {
  const handlers = [];
  return {
    auth: {
      onAuthStateChange: vi.fn((cb) => {
        handlers.push(cb);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
    },
    realtime: { setAuth: vi.fn() },
    emit: (event, session) => handlers.forEach((cb) => cb(event, session)),
  };
}

let browser;

beforeEach(async () => {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-key");
  browser = makeBrowserClient();
  createBrowserClient.mockReturnValue(browser);
});

async function loadClient() {
  const mod = await import("./client");
  return mod.createClient();
}

describe("createClient (browser)", () => {
  it("builds the client from the public env vars", async () => {
    await loadClient();

    expect(createBrowserClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "publishable-key",
    );
  });

  it("memoizes the client", async () => {
    const mod = await import("./client");

    expect(mod.createClient()).toBe(mod.createClient());
    expect(createBrowserClient).toHaveBeenCalledTimes(1);
  });

  // supabase-js は INITIAL_SESSION では realtime.setAuth を呼ばないため、
  // これがないとリロード直後の購読がRLSで全て落ちる（回帰テスト）
  it("hands the restored session's token to Realtime on INITIAL_SESSION", async () => {
    await loadClient();

    browser.emit("INITIAL_SESSION", { access_token: "user-jwt" });

    expect(browser.realtime.setAuth).toHaveBeenCalledWith("user-jwt");
  });

  it("keeps Realtime in sync on sign-in and token refresh", async () => {
    await loadClient();

    browser.emit("SIGNED_IN", { access_token: "jwt-1" });
    browser.emit("TOKEN_REFRESHED", { access_token: "jwt-2" });

    expect(browser.realtime.setAuth).toHaveBeenNthCalledWith(1, "jwt-1");
    expect(browser.realtime.setAuth).toHaveBeenNthCalledWith(2, "jwt-2");
  });

  it("does not push an empty token when there is no session", async () => {
    await loadClient();

    browser.emit("INITIAL_SESSION", null);
    browser.emit("SIGNED_OUT", null);

    expect(browser.realtime.setAuth).not.toHaveBeenCalled();
  });
});
