import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

function isAuthorizedRevalidateRequest(secret) {
  return secret === process.env.MY_SECRET_TOKEN;
}

export async function POST(request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const tag = searchParams.get('tag');

  if (!isAuthorizedRevalidateRequest(secret)) {
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
  }

  try {
    // microCMSからの通知を受け取ってタグを再検証
    revalidateTag(tag);

    return NextResponse.json({
      revalidated: true,
      now: Date.now(),
    });
  } catch (err) {
    return NextResponse.json({ message: 'Error revalidating' }, { status: 500 });
  }
}
