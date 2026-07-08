import { r2 } from "@/lib/r2";
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createClient } from "@/lib/supabase/server";

const CONTENT_TYPES = {
  // 画像
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  pdf: 'application/pdf',
}

function getContentType(filename) {
  const ext = filename.split('.').pop()?.toLowerCase()
  return CONTENT_TYPES[ext ?? ''] ?? 'application/octet-stream'
}

// パストラバーサル防止: パス区切りや".."を含む値をS3キーに使わせない
function isSafePathSegment(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    !value.includes("/") &&
    !value.includes("\\") &&
    !value.includes("..")
  )
}

function buildUploadKey({ role, userId, kinds, filename }) {
  return `${role}/${userId}/${kinds}/${filename}`
}

// roleはmiddleware(proxy.js)と同じくprofilesテーブルを正とする。
// user_metadata.roleは現行のOTPサインアップフローでは設定されず、nullのままになる。
async function fetchCallerRole(supabase, userId) {
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle()
  return data?.role
}

async function createUploadUrl({ key, contentType }) {
  return getSignedUrl(
    r2,
    new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: 600 }
  )
}

export async function POST(req) {
  const searchParams = req.nextUrl.searchParams;
  const filename = searchParams.get("filename");
  const kinds = searchParams.get("kinds");

  if (!isSafePathSegment(filename) || !isSafePathSegment(kinds)) {
    return new Response("Invalid filename or kinds", { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const role = await fetchCallerRole(supabase, user.id);
  if (role !== "user" && role !== "mentor") {
    return new Response("Role not found", { status: 403 });
  }

  const key = buildUploadKey({ role, userId: user.id, kinds, filename });
  const url = await createUploadUrl({ key, contentType: getContentType(filename) });

  return Response.json(url);
}
