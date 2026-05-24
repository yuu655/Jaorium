import { r2 } from "@/lib/r2";
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createClient } from "@/lib/supabase/server";

const getContentType = (filename) => {
  const ext = filename.split('.').pop()?.toLowerCase()
  const types = {
    // 画像
    'png'  : 'image/png',
    'jpg'  : 'image/jpeg',
    'jpeg' : 'image/jpeg',
    'webp' : 'image/webp',
    'gif'  : 'image/gif',
    'svg'  : 'image/svg+xml',
    'pptx' : 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'pdf'  : 'application/pdf',
  }
  return types[ext ?? ''] ?? 'application/octet-stream'
}

export async function POST(req) {
  const searchParams = req.nextUrl.searchParams;
  const filename = searchParams.get("filename");
  const kinds = searchParams.get("kinds");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = await getSignedUrl(
    r2,
    new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: `${user.user_metadata.role}/${user.id}/${kinds}/${filename}`,
      ContentType: getContentType(filename),
    }),
    { expiresIn: 600 }
  )

  return Response.json(url);
}
