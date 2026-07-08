import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@supabase/ssr", () => ({ createServerClient: vi.fn() }));
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => mockCookieStore),
}));

import { createServerClient } from "@supabase/ssr";
import { createClient } from "./server";

let mockCookieStore;

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "anon-key");
  createServerClient.mockReturnValue({});
});

describe("createClient (session-scoped Supabase client)", () => {
  it("exposes the cookie store's getAll", async () => {
    mockCookieStore = { getAll: vi.fn(() => [{ name: "sb-token", value: "abc" }]), set: vi.fn() };

    await createClient();

    const [, , options] = createServerClient.mock.calls[0];
    expect(options.cookies.getAll()).toEqual([{ name: "sb-token", value: "abc" }]);
  });

  it("writes each cookie via the cookie store's set", async () => {
    const set = vi.fn();
    mockCookieStore = { getAll: vi.fn(() => []), set };

    await createClient();

    const [, , options] = createServerClient.mock.calls[0];
    options.cookies.setAll([
      { name: "a", value: "1", options: {} },
      { name: "b", value: "2", options: {} },
    ]);

    expect(set).toHaveBeenCalledTimes(2);
  });

  // Bug: cookieStore.set() throwing is an *expected* case when this client is used
  // from a Server Component (Server Components can't set cookies) - the comment right
  // next to the catch block says so. The catch block is supposed to just log and
  // swallow that error, but it referenced an unbound `err` instead of the caught
  // exception, so entering the catch block itself threw a ReferenceError.
  it("does not throw when cookieStore.set throws (e.g. called from a Server Component)", async () => {
    const thrown = new Error("Cookies can only be modified in a Server Action or Route Handler");
    const set = vi.fn(() => {
      throw thrown;
    });
    mockCookieStore = { getAll: vi.fn(() => []), set };

    await createClient();

    const [, , options] = createServerClient.mock.calls[0];

    expect(() => options.cookies.setAll([{ name: "a", value: "1", options: {} }])).not.toThrow();
    expect(console.error).toHaveBeenCalledWith("cookie setAll error:", thrown);
  });
});
