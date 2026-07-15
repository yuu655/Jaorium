import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import getUrls from "@/utils/getUrls";

async function exchangeCodeForSession(code) {
  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  return { ok: !error }
}

async function verifyOtpTokenHash(token_hash, type) {
  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({ token_hash, type })
  return { ok: !error }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)

  // Supabaseから渡されるパラメータ
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/'

  // token_hash方式（メールテンプレートからの直接リンク）。
  // PKCEのcode方式はcode_verifierクッキーを持つ「登録したブラウザ」でしか
  // 成功しないため、別端末・メールアプリ内ブラウザで開くと失敗する。
  // token_hash + verifyOtp はクッキー不要で、どの端末で開いても成功する。
  if (token_hash && type) {
    const { ok } = await verifyOtpTokenHash(token_hash, type)
    if (ok) {
      return NextResponse.redirect(`${getUrls()}${next}`)
    }
    return NextResponse.redirect(`${getUrls()}/error`)
  }

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
