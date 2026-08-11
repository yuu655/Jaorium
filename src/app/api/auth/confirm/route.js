import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import getUrls from "@/utils/getUrls";

async function exchangeCodeForSession(code) {
  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  return { ok: !error, error }
}

async function verifyOtpTokenHash(token_hash, type) {
  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({ token_hash, type })
  return { ok: !error, error }
}

// 原因が分かるよう、サーバーログに残しつつ/errorページにもメッセージを渡す
// （以前はここで握りつぶしていたため、失敗時に何も手がかりが残らなかった）
function redirectToError(reason, error) {
  console.error(`auth/confirm ${reason} error:`, error?.message ?? error)
  const message = error?.message ?? "認証に失敗しました"
  return NextResponse.redirect(`${getUrls()}/error?message=${encodeURIComponent(message)}`)
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
    const { ok, error } = await verifyOtpTokenHash(token_hash, type)
    if (ok) {
      return NextResponse.redirect(`${getUrls()}${next}`)
    }
    return redirectToError('verifyOtp', error)
  }

  if (code) {
    const { ok, error } = await exchangeCodeForSession(code)
    if (ok) {
      // 認証成功 → next で指定されたページへリダイレクト
      return NextResponse.redirect(`${getUrls()}${next}`)
    }
    return redirectToError('exchangeCodeForSession', error)
  }

  // code/token_hash+typeのいずれも無い＝不正なリンク
  console.error('auth/confirm: missing code or token_hash+type', {
    hasCode: Boolean(code),
    hasTokenHash: Boolean(token_hash),
    type,
  })
  return NextResponse.redirect(
    `${getUrls()}/error?message=${encodeURIComponent('認証パラメータが不足しています')}`,
  )
}
