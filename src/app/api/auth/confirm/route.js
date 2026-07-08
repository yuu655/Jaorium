import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import getUrls from "@/utils/getUrls";

async function exchangeCodeForSession(code) {
  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  return { ok: !error }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)

  // Supabaseから渡されるパラメータ
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const { ok } = await exchangeCodeForSession(code)
    if (ok) {
      // 認証成功 → next で指定されたページへリダイレクト
      return NextResponse.redirect(`${getUrls()}${next}`)
    }
  }

  // 認証失敗 → エラーページへリダイレクト
  return NextResponse.redirect(`${getUrls()}/error`)
}
