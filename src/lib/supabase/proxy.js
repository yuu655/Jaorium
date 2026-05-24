import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function updateSession(request) {
  // ① supabaseResponseを最初に作る
  let supabaseResponse = NextResponse.next({
    request,
  });

  // ② Supabaseクライアント作成（getAll/setAllで橋渡し）
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          // ブラウザから届いたクッキーをSupabaseに渡す
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Supabaseがトークンをリフレッシュした時、新しい値をsupabaseResponseに書き込む
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const pathname = request.nextUrl.pathname;

  // ③ supabaseResponseのクッキーを引き継いでredirectするヘルパー
  const redirectTo = (url) => {
    const redirectResponse = NextResponse.redirect(new URL(url, request.url));

    // supabaseResponseの新しいトークンをコピー（これをしないと捨てられる）
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });

    return redirectResponse;
  };

  // ④ トークンの検証（ここでgetAll/setAllが動く）
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  console.log("pathname:", pathname);
  console.log("user:", user);
  console.log("error:", error);
  console.log("role:", user?.app_metadata?.role);

  // ⑤ クッキーはあるのにuserが取れない = 壊れたクッキー
  const hasSbCookies = request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-"));

  if (error && !user && hasSbCookies) {
    const redirectResponse = NextResponse.redirect(
      new URL("/login", request.url),
    );

    request.cookies.getAll().forEach((cookie) => {
      if (cookie.name.startsWith("sb-")) {
        redirectResponse.cookies.delete(cookie.name);
      }
    });

    return redirectResponse;
  }

  // ⑥ 未ログイン（クッキー自体がない or 無効）
  if (!user) {
    if (
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/setAccount") ||
      pathname.startsWith("/resetPass")
    ) {
      return redirectTo("/login");
    }

    return supabaseResponse;
  }

  // ⑦ ログイン済みの処理
  const role = user?.user_metadata?.role;

  // roleが未設定のままsetAccountに来た場合は不正なので強制サインアウト
  if (role === undefined && pathname === "/setAccount") {
    await supabase.auth.signOut();
    return redirectTo("/signup/mentor");
  }

  if (
    role === "user" &&
    (pathname === "/login" ||
      pathname.startsWith("/setAccount") ||
      pathname.startsWith("/signup") ||
      pathname === "/dashboard" ||
      pathname === "/dashboard/mentor")
  ) {
    return redirectTo("/dashboard/user");
  }

  if (
    role === "mentor" &&
    (pathname === "/login" ||
      pathname.startsWith("/setAccount") ||
      pathname.startsWith("/signup") ||
      pathname === "/dashboard" ||
      pathname === "/dashboard/user")
  ) {
    return redirectTo("/dashboard/mentor");
  }

  // ⑧ 何も該当しない場合はそのまま通す
  return supabaseResponse;
}
