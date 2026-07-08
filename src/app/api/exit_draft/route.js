import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const redirectTo = searchParams.get('redirect') ?? '/';

  
  const dm = await draftMode();
  dm.disable();

  redirect(redirectTo);
}
