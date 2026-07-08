import { draftMode, cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const PREVIEW_COOKIE_MAX_AGE = 60 * 10;

function isAuthorizedPreviewRequest(secret) {
  return Boolean(secret) && secret === process.env.MICROCMS_PREVIEW_SECRET;
}

async function extendPreviewCookieLifetime(cookieStore) {
  const bypass = cookieStore.get('__prerender_bypass')?.value;
  const preview = cookieStore.get('__next_preview_data')?.value;

  if (bypass) {
    cookieStore.set('__prerender_bypass', bypass, {
      httpOnly: true,
      path: '/',
      maxAge: PREVIEW_COOKIE_MAX_AGE,
    });
  }

  if (preview) {
    cookieStore.set('__next_preview_data', preview, {
      httpOnly: true,
      path: '/',
      maxAge: PREVIEW_COOKIE_MAX_AGE,
    });
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const slug = searchParams.get('slug');
  const draftKey = searchParams.get('draftKey');
  const secret = searchParams.get('secret');

  // パラメータチェック
  if (!slug || !draftKey) {
    return new Response('Invalid params', { status: 400 });
  }

  // secret チェック
  if (!isAuthorizedPreviewRequest(secret)) {
    return new Response('Unauthorized', { status: 401 });
  }

  // draftMode 有効化
  const dm = await draftMode();
  dm.enable();

  // Cookie の有効期限を10分に制限
  const cookieStore = await cookies();
  await extendPreviewCookieLifetime(cookieStore);

  // プレビュー対象ページへ
  return redirect(`/articles/${slug}?draftKey=${draftKey}`);
}
