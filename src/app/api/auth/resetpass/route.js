import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'  // ← importが必要

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    // ✅ 戻り値からerrorを受け取る
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error(error)
      return NextResponse.redirect(`https://jaorium.com/error`)
    }
  }

  // ✅ セッション交換成功後にパスワード変更ページへ
  return NextResponse.redirect(`https://jaorium.com/resetPass`)
}