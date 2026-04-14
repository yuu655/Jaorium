import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

export async function POST(request) {
  // 1. URLクエリパラメータからシークレットトークンを取得
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const tag = searchParams.get('tag');

  // 2. セキュリティチェック（環境変数と比較）
  if (secret !== process.env.MY_SECRET_TOKEN) {
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
  }

  try {
    // 3. microCMSからの通知を受け取ってタグを再検証
    revalidateTag(tag);
    
    return NextResponse.json({ 
      revalidated: true, 
      now: Date.now() 
    });
  } catch (err) {
    return NextResponse.json({ message: 'Error revalidating' }, { status: 500 });
  }
}