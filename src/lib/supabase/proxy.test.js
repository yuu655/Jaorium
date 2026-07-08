import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseMock, createChain } from "@/test/supabaseMock";

vi.mock("@supabase/ssr", () => ({ createServerClient: vi.fn() }));

import { createServerClient } from "@supabase/ssr";
import { updateSession } from "./proxy";

function makeRequest(pathname, cookies = []) {
  return {
    url: `https://www.jaorium.com${pathname}`,
    nextUrl: { pathname },
    headers: new Headers(),
    cookies: { getAll: () => cookies },
  };
}

function mockSession({ user = null, profile = null, authError = null } = {}) {
  const supabase = createSupabaseMock({
    auth: { getUser: vi.fn(async () => ({ data: { user }, error: authError })) },
    from: { profiles: () => createChain({ data: profile, error: null }) },
  });
  createServerClient.mockReturnValue(supabase);
  return supabase;
}

const locationOf = (res) => res.headers.get("location");

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "anon-key");
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("updateSession — 未ログイン", () => {
  it.each(["/dashboard", "/dashboard/user", "/admin", "/setAccount/user", "/resetPass"])(
    "保護ページ %s へのアクセスは /login へリダイレクトする",
    async (pathname) => {
      mockSession();

      const res = await updateSession(makeRequest(pathname));

      expect(locationOf(res)).toBe("https://www.jaorium.com/login");
    },
  );

  it.each(["/", "/mentors", "/articles/1", "/login", "/signup/user"])(
    "公開ページ %s はそのまま通す",
    async (pathname) => {
      mockSession();

      const res = await updateSession(makeRequest(pathname));

      expect(locationOf(res)).toBeNull();
    },
  );

  it("未ログイン時は profiles テーブルを一切照会しない（undefined-uuidクエリ防止）", async () => {
    const supabase = mockSession();

    await updateSession(makeRequest("/mentors"));

    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("壊れたセッションCookie（AuthSessionMissingError以外のエラー + sb-クッキーあり）は /login へ", async () => {
    mockSession({
      authError: { name: "AuthApiError", message: "invalid token" },
    });

    const res = await updateSession(
      makeRequest("/mentors", [{ name: "sb-access-token", value: "broken" }]),
    );

    expect(locationOf(res)).toBe("https://www.jaorium.com/login");
  });
});

describe("updateSession — role: user", () => {
  const user = { id: "user-1" };

  it.each(["/login", "/signup/user", "/dashboard", "/dashboard/mentor", "/setAccount", "/setAccount/user", "/"])(
    "セットアップ完了済みなら %s から /dashboard/user へ",
    async (pathname) => {
      mockSession({ user, profile: { role: "user", set: true } });

      const res = await updateSession(makeRequest(pathname));

      expect(locationOf(res)).toBe("https://www.jaorium.com/dashboard/user");
    },
  );

  it("/setAccount/mentor（他ロールのオンボーディング）は /dashboard/user へ", async () => {
    mockSession({ user, profile: { role: "user", set: true } });

    const res = await updateSession(makeRequest("/setAccount/mentor"));

    expect(locationOf(res)).toBe("https://www.jaorium.com/dashboard/user");
  });

  it("セットアップ未完了（set=false）なら / から /setAccount/user へ", async () => {
    mockSession({ user, profile: { role: "user", set: false } });

    const res = await updateSession(makeRequest("/"));

    expect(locationOf(res)).toBe("https://www.jaorium.com/setAccount/user");
  });

  it("セットアップ未完了のユーザーが /setAccount/user 自体にいるときは自己リダイレクトしない", async () => {
    // ここでリダイレクトすると /setAccount/user → /setAccount/user の無限ループになり、
    // フォーム送信（Server ActionのPOST）が ERR_TOO_MANY_REDIRECTS で失敗する
    mockSession({ user, profile: { role: "user", set: false } });

    const res = await updateSession(makeRequest("/setAccount/user"));

    expect(locationOf(res)).toBeNull();
  });

  it("/dashboard/admin へのアクセスは /dashboard へ戻す", async () => {
    mockSession({ user, profile: { role: "user", set: true } });

    const res = await updateSession(makeRequest("/dashboard/admin"));

    expect(locationOf(res)).toBe("https://www.jaorium.com/dashboard");
  });

  it.each(["/dashboard/user", "/mentors", "/dashboard/chat/abc"])(
    "自分の領域 %s はそのまま通す",
    async (pathname) => {
      mockSession({ user, profile: { role: "user", set: true } });

      const res = await updateSession(makeRequest(pathname));

      expect(locationOf(res)).toBeNull();
    },
  );
});

describe("updateSession — role: mentor", () => {
  const user = { id: "mentor-1" };

  it.each(["/login", "/signup/mentor", "/dashboard", "/dashboard/user", "/setAccount", "/setAccount/mentor", "/"])(
    "セットアップ完了済みなら %s から /dashboard/mentor へ",
    async (pathname) => {
      mockSession({ user, profile: { role: "mentor", set: true } });

      const res = await updateSession(makeRequest(pathname));

      expect(locationOf(res)).toBe("https://www.jaorium.com/dashboard/mentor");
    },
  );

  it("/setAccount/user は /dashboard/mentor へ", async () => {
    mockSession({ user, profile: { role: "mentor", set: true } });

    const res = await updateSession(makeRequest("/setAccount/user"));

    expect(locationOf(res)).toBe("https://www.jaorium.com/dashboard/mentor");
  });

  it("セットアップ未完了なら /setAccount/mentor へ", async () => {
    mockSession({ user, profile: { role: "mentor", set: false } });

    const res = await updateSession(makeRequest("/dashboard"));

    expect(locationOf(res)).toBe("https://www.jaorium.com/setAccount/mentor");
  });

  it("セットアップ未完了のメンターが /setAccount/mentor 自体にいるときは自己リダイレクトしない", async () => {
    mockSession({ user, profile: { role: "mentor", set: false } });

    const res = await updateSession(makeRequest("/setAccount/mentor"));

    expect(locationOf(res)).toBeNull();
  });

  it("/dashboard/mentor はそのまま通す", async () => {
    mockSession({ user, profile: { role: "mentor", set: true } });

    const res = await updateSession(makeRequest("/dashboard/mentor"));

    expect(locationOf(res)).toBeNull();
  });
});

describe("updateSession — role: admin", () => {
  const user = { id: "admin-1" };

  it.each(["/", "/dashboard", "/dashboard/user", "/dashboard/mentor", "/setAccount/user"])(
    "%s から /dashboard/admin へ",
    async (pathname) => {
      mockSession({ user, profile: { role: "admin", set: true } });

      const res = await updateSession(makeRequest(pathname));

      expect(locationOf(res)).toBe("https://www.jaorium.com/dashboard/admin");
    },
  );

  it("/dashboard/admin はそのまま通す", async () => {
    mockSession({ user, profile: { role: "admin", set: true } });

    const res = await updateSession(makeRequest("/dashboard/admin"));

    expect(locationOf(res)).toBeNull();
  });
});

describe("updateSession — role: pending（役割未確定）", () => {
  // 現状仕様の記録: pending はどのロール分岐にも該当せず、/dashboard などへ
  // そのままアクセスできてしまう（/dashboard/admin だけは /dashboard へ戻される）。
  // 仕様書2章の要確認事項と関連するため、挙動をここで固定しておく。
  it("/dashboard をそのまま通す（現状挙動の記録）", async () => {
    mockSession({ user: { id: "u1" }, profile: { role: "pending", set: false } });

    const res = await updateSession(makeRequest("/dashboard"));

    expect(locationOf(res)).toBeNull();
  });

  it("/dashboard/admin は /dashboard へ戻す", async () => {
    mockSession({ user: { id: "u1" }, profile: { role: "pending", set: false } });

    const res = await updateSession(makeRequest("/dashboard/admin"));

    expect(locationOf(res)).toBe("https://www.jaorium.com/dashboard");
  });
});
