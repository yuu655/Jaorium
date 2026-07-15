import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import getUrls from "@/utils/getUrls";

async function createSessionClient(cookieStore) {
  return createServerClient(
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
}

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')

  // token_hash方式（メールテンプレートからの直接リンク）。
  // code方式（PKCE）はリセットを申請したブラウザでしか成功しないため、
  // 別端末・メールアプリ内ブラウザで開くケースはこちらで処理する。
  if (token_hash && type) {
    const cookieStore = await cookies()
    const supabase = await createSessionClient(cookieStore)

    const { error } = await supabase.auth.verifyOtp({ token_hash, type })

    if (error) {
      console.error(error)
      return NextResponse.redirect(`${getUrls()}/error`)
    }

    return NextResponse.redirect(`${getUrls()}/resetPass`)
  }

  if (code) {
    const cookieStore = await cookies()
    const supabase = await createSessionClient(cookieStore)

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error(error)
      return NextResponse.redirect(`${getUrls()}/error`)
    }
  }

  // セッション交換成功後にパスワード変更ページへ
  return NextResponse.redirect(`${getUrls()}/resetPass`)
}
