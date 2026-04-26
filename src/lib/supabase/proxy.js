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
  const role_admin = user?.app_metadata?.role_admin;

  // 未ログイン → リダイレクトa
  if (!user && (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/setAccount') ||
    pathname.startsWith('/resetPass')
  )) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (user) {
    // if(pathname === '/login' || pathname.startsWith('/signup')) {
    //   return NextResponse.redirect(new URL('/dashboard', request.url));
    // }
    if (role === undefined && pathname === '/setAccount') {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL('/signup/mentor', request.url));
    }
    // if(role === undefined && (pathname.startsWith('/dashboard'))) {
    // 
    // }
    if (role === "user" && (pathname === '/login' || pathname === '/setAccount' || pathname === '/setAccount/mentor' || pathname === '/setAccount/user' || pathname.startsWith('/signup') || pathname === '/dashboard' || pathname === '/dashboard/mentor')) {
      return NextResponse.redirect(new URL('/dashboard/user', request.url));
    }
    if (role === "mentor" && (pathname === '/login' || pathname === '/setAccount' || pathname === '/setAccount/mentor' || pathname === '/setAccount/user' || pathname.startsWith('/signup')|| pathname === '/dashboard'  || pathname === '/dashboard/user')) {
      return NextResponse.redirect(new URL('/dashboard/mentor', request.url));
    }
    if (pathname.startsWith('/admin') && role_admin !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return supabaseResponse;
}
