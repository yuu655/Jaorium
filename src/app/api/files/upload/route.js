import { PutObjectCommand } from "@aws-sdk/client-s3";
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { r2 } from "@/lib/r2";

export async function POST(request) {
    const { searchParams } = new URL(request.url);
      const meeting_id = searchParams.get('id');
      const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    },
  );
  const { user } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");
  const folder = formData.get("folder") ?? "uploads";

  const key = `${meeting_id}/`;
  //           ↑ アップロード時も必ずUUIDを先頭に

  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: key,
      Body: Buffer.from(await file.arrayBuffer()),
      ContentType: file.type,
    }),
  );

  return Response.json({ key });
}
