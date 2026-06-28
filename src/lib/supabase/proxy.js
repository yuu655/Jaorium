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

//   console.log("middleware user:", user);
// console.log("middleware error:", error);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id)
    .single();


  // console.log("pathname:", pathname);
  // console.log("user:", user);
  // console.log("error:", error);
  // console.log("role:", user?.app_metadata?.role);

  // ⑤ クッキーはあるのにuserが取れない = 壊れたクッキー
  // const hasSbCookies = request.cookies
  //   .getAll()
  //   .some((cookie) => cookie.name.startsWith("sb-"));

  // if (error && !user && hasSbCookies) {
  //   console.log("sadfgsdgsdgsfgsdgsgsd")
  //   const redirectResponse = NextResponse.redirect(
  //     new URL("/login", request.url),
  //   );

  //   request.cookies.getAll().forEach((cookie) => {
  //     if (cookie.name.startsWith("sb-")) {
  //       redirectResponse.cookies.delete(cookie.name);
  //     }
  //   });

  //   return redirectResponse;
  // }
if (error) {
  console.error("middleware getUser error:", error.name, error.message);
}

const hasSbCookies = request.cookies
  .getAll()
  .some((cookie) => cookie.name.startsWith("sb-"));

// AuthSessionMissingErrorは「未ログイン/Cookie伝播中」の正常な状態なので除外
const isGenuinelyCorrupted =
  error && error.name !== "AuthSessionMissingError" && hasSbCookies;

if (isGenuinelyCorrupted && !user) {
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
  const role = profile?.role;

  if(role !== "admin"){
    if(pathname === "/dashboard/admin"){
      return redirectTo("/dashboard");
    }
  }else{
    if(pathname === "/dashboard" || pathname === "/dashboard/user" || pathname === "/dashboard/mentor" || pathname.startsWith("/setAccount") || pathname === "/"){
      return redirectTo("/dashboard/admin")
    }
  }

  // if(user){
  //   if(profile?.set === false){
  //     if(pathname === "/"){
  //       if(role === "user"){
  //         return redirectTo("/setAccount/user");
  //       }else if (role === "mentor"){
  //         return redirectTo("/setAccount/mentor");
  //       }
  //     }
  //   }
  // }


  // roleが未設定のままsetAccountに来た場合は不正なので強制サインアウト
  // if (role === undefined && pathname === "/setAccount") {
  //   await supabase.auth.signOut();
  //   return redirectTo("/signup/mentor");
  // }
  console.log("role:", role);
  if(role === "user"){
    
    if(pathname === "/setAccount/mentor"){
      return redirectTo("/dashboard/user");
    }
      console.log("b");
    if(pathname === "/setAccount" || pathname === "/setAccount/user" || pathname === "/" || pathname === "/login" ||pathname.startsWith("/signup") || pathname === "/dashboard" || pathname === "/dashboard/mentor"){
      console.log("dddddddddddddddddddddd")
      const {data: profile, error: profileError} = await supabase.from("profiles").select("*").eq("id", user?.id).single();
      if(profile?.set === false){
        return redirectTo("/setAccount/user");
      }
      return redirectTo("/dashboard/user");
    }
  }else if(role === "mentor"){
    if(pathname === "/setAccount/user"){
      return redirectTo("/dashboard/mentor");
    }
    console.log("c");
    if(pathname === "/setAccount" || pathname === "/setAccount/mentor" || pathname === "/" || pathname === "/login" || pathname.startsWith("/signup") || pathname === "/dashboard" || pathname === "/dashboard/user"){
      const {data: profile, error: profileError} = await supabase.from("profiles").select("*").eq("id", user?.id).single();
      if(profile?.set === false){
        return redirectTo("/setAccount/mentor");
      }
      return redirectTo("/dashboard/mentor");
    }
  }
  // if (
  //   role === "user" &&
  //   (pathname === "/login" ||
  //     // pathname.startsWith("/setAccount") ||
  //     pathname.startsWith("/signup") ||
  //     pathname === "/dashboard" ||
  //     pathname === "/dashboard/mentor")
  // ) {
  //   return redirectTo("/dashboard/user");
  // }

  // if (
  //   role === "mentor" &&
  //   (pathname === "/login" ||
  //     // pathname.startsWith("/setAccount") ||
  //     pathname.startsWith("/signup") ||
  //     pathname === "/dashboard" ||
  //     pathname === "/dashboard/user")
  // ) {
  //   return redirectTo("/dashboard/mentor");
  // }

  // ⑧ 何も該当しない場合はそのまま通す
  return supabaseResponse;
}
