import { draftMode, cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const PREVIEW_SECRET = process.env.MICROCMS_PREVIEW_SECRET;

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
  if (!secret || secret !== PREVIEW_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  // draftMode 有効化
  const dm = await draftMode();
  dm.enable();

  // Cookie の有効期限を 10 分に制限
  const cookieStore = await cookies();
  const bypass = cookieStore.get('__prerender_bypass')?.value;
  const preview = cookieStore.get('__next_preview_data')?.value;

  if (bypass) {
    cookieStore.set('__prerender_bypass', bypass, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 10,
    });
  }

  if (preview) {
    cookieStore.set('__next_preview_data', preview, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 10,
    });
  }

  // プレビュー対象ページへ
  return redirect(`/articles/${slug}?draftKey=${draftKey}`);
}
