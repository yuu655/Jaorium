import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

// ---- 純粋ロジック（仕様書4章のルーティングルール） ----

// 未ログインではアクセスできないパス
const LOGIN_REQUIRED_PREFIXES = ["/dashboard", "/admin", "/setAccount", "/resetPass"];

function requiresLogin(pathname) {
  return LOGIN_REQUIRED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

// 「ロール外のページに来たユーザーをどこへ飛ばすか」を返す。リダイレクト不要ならnull。
// isProfileSet=false（オンボーディング未完了）の場合はダッシュボードではなく
// setAccountへ誘導する。pending等の未知のロールは何もしない（現状挙動の維持）。
function resolveRoleRedirect(role, pathname, isProfileSet) {
  const destination = roleDestinationFor(role, pathname, isProfileSet);
  // 行き先が現在地と同じ場合は何もしない。ここでリダイレクトすると
  // set=falseのユーザーが /setAccount/user に滞在できず（フォームPOSTも含めて）
  // 自己リダイレクトの無限ループ（ERR_TOO_MANY_REDIRECTS）になる
  return destination === pathname ? null : destination;
}

function roleDestinationFor(role, pathname, isProfileSet) {
  if (role === "admin") {
    if (
      pathname === "/dashboard" ||
      pathname === "/dashboard/user" ||
      pathname === "/dashboard/mentor" ||
      pathname.startsWith("/setAccount") ||
      pathname === "/"
    ) {
      return "/dashboard/admin";
    }
    return null;
  }

  // admin以外はadmin用ダッシュボードに入れない
  if (pathname === "/dashboard/admin") {
    return "/dashboard";
  }

  if (role === "user") {
    if (pathname === "/setAccount/mentor") {
      return "/setAccount";
    }
    if (
      pathname === "/setAccount" ||
      pathname === "/setAccount/mentor" ||
      pathname === "/" ||
      pathname === "/login" ||
      pathname.startsWith("/signup") ||
      pathname === "/dashboard" ||
      pathname === "/dashboard/mentor"
    ) {
      return isProfileSet === false ? "/setAccount/user" : "/dashboard/user";
    }
    return null;
  }

  if (role === "mentor") {
    if (pathname === "/setAccount/user") {
      return "/setAccount";
    }
    if (
      pathname === "/setAccount" ||
      pathname === "/setAccount/user" ||
      pathname === "/" ||
      pathname === "/login" ||
      pathname.startsWith("/signup") ||
      pathname === "/dashboard" ||
      pathname === "/dashboard/user"
    ) {
      return isProfileSet === false ? "/setAccount/mentor" : "/dashboard/mentor";
    }
    return null;
  }

  return null;
}

// ---- ミドルウェア本体 ----

export async function updateSession(request) {
  // Supabaseがトークンをリフレッシュした場合、setAll経由でこのresponseに新Cookieが書き込まれる
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const pathname = request.nextUrl.pathname;

  // supabaseResponseに積まれた新しいトークンCookieを引き継いでリダイレクトする
  // （コピーしないとリフレッシュ済みトークンが捨てられる）
  const redirectTo = (url) => {
    const redirectResponse = NextResponse.redirect(new URL(url, request.url));
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectResponse;
  };

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // AuthSessionMissingErrorは「未ログイン」の正常系なのでログ・破損判定の対象外
  const isGenuineAuthError = error && error.name !== "AuthSessionMissingError";
  if (isGenuineAuthError) {
    console.error("middleware getUser error:", error.name, error.message);
  }

  // sb-クッキーがあるのに検証に失敗した = 壊れたセッション。クッキーを消してログインへ
  const hasSbCookies = request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-"));

  if (isGenuineAuthError && !user && hasSbCookies) {
    const redirectResponse = NextResponse.redirect(new URL("/login", request.url));
    request.cookies.getAll().forEach((cookie) => {
      if (cookie.name.startsWith("sb-")) {
        redirectResponse.cookies.delete(cookie.name);
      }
    });
    return redirectResponse;
  }

  // 未ログイン: 保護ページのみログインへ。profilesの照会はしない
  if (!user) {
    if (requiresLogin(pathname)) {
      return redirectTo("/login");
    }
    return supabaseResponse;
  }

  // ログイン済み: ロールとオンボーディング状態を取得してリダイレクト判定
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const destination = resolveRoleRedirect(profile?.role, pathname, profile?.set);
  if (destination) {
    return redirectTo(destination);
  }

  return supabaseResponse;
}
