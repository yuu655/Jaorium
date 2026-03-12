import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function updateSession(request) {
  const pathname = request.nextUrl.pathname;

  let supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getSession() はCookieを読むだけ = ネットワーク通信なし
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  const role = user?.user_metadata?.role;  // JWTから取得

  // 未ログイン → リダイレクト
  if (!user && (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/setAccount')
  )) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (user) {
    if (role === undefined && (pathname === '/login' || pathname.startsWith('/dashboard'))) {
      return NextResponse.redirect(new URL('/setAccount', request.url));
    }
    if (role === "user" && (pathname === '/login' || pathname === '/setAccount' || pathname === '/dashboard' || pathname === '/dashboard/mentor')) {
      return NextResponse.redirect(new URL('/dashboard/user', request.url));
    }
    if (role === "mentor" && (pathname === '/login' || pathname === '/setAccount' || pathname === '/dashboard' || pathname === '/dashboard/user')) {
      return NextResponse.redirect(new URL('/dashboard/mentor', request.url));
    }
    if (pathname.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return supabaseResponse;
}
