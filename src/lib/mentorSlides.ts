import { GetObjectCommand, ListObjectsV2Command, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2 } from "@/lib/r2";

// メンターごとのスライドPDFは非公開バケットの mentors/{mentorId}/slide/{filename} に置く。
// 公開URLは存在しないので、閲覧もアップロードも必ず短命の署名付きURL経由にする。

export const MAX_SLIDE_BYTES = 50 * 1024 * 1024;
const UPLOAD_URL_TTL_SECONDS = 600;
const VIEW_URL_TTL_SECONDS = 3600;

export type MentorSlide = {
  key: string;
  filename: string;
  size: number;
  lastModified: string | null;
};

// 環境変数は呼び出し時に読む（テストのstubEnvがモジュール評価より後に走るため）
function bucketName(): string {
  return process.env.CLOUDFLARE_R2_BUCKET_NAME!;
}

// パストラバーサル防止: パス区切り・".."・制御文字を含む値をキーに使わせない
export function isSafePathSegment(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 255 &&
    !value.includes("/") &&
    !value.includes("\\") &&
    !value.includes("..") &&
    !/[\u0000-\u001f\u007f]/.test(value)
  );
}

export function isPdfFilename(filename: unknown): filename is string {
  return isSafePathSegment(filename) && filename.toLowerCase().endsWith(".pdf");
}

export function slidePrefix(mentorId: string): string {
  return `mentors/${mentorId}/slide/`;
}

export function slideKey(mentorId: string, filename: string): string {
  return `${slidePrefix(mentorId)}${filename}`;
}

// ContentLengthも署名に含めるので、申告サイズと違うファイルはR2側で拒否される
export async function createSlideUploadUrl(
  mentorId: string,
  filename: string,
  size: number,
): Promise<string> {
  return getSignedUrl(
    r2,
    new PutObjectCommand({
      Bucket: bucketName(),
      Key: slideKey(mentorId, filename),
      ContentType: "application/pdf",
      ContentLength: size,
    }),
    { expiresIn: UPLOAD_URL_TTL_SECONDS },
  );
}

export async function listSlides(mentorId: string): Promise<MentorSlide[]> {
  const prefix = slidePrefix(mentorId);
  const slides: MentorSlide[] = [];
  let continuationToken: string | undefined;

  do {
    const res = await r2.send(
      new ListObjectsV2Command({
        Bucket: bucketName(),
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    );

    for (const obj of res.Contents ?? []) {
      if (!obj.Key) continue;
      const filename = obj.Key.slice(prefix.length);
      // サブディレクトリ配下や拡張子違いは対象外
      if (!isPdfFilename(filename)) continue;
      slides.push({
        key: obj.Key,
        filename,
        size: obj.Size ?? 0,
        lastModified: obj.LastModified ? obj.LastModified.toISOString() : null,
      });
    }

    continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (continuationToken);

  // 新しいものを上に
  return slides.sort((a, b) => (b.lastModified ?? "").localeCompare(a.lastModified ?? ""));
}

// mentors/ 配下を一括で列挙し、slide/ 直下にPDFがあるメンターIDを返す。
// メンターごとにListを投げるとメンター数ぶんリクエストが増えるため1回の走査にまとめる。
export async function listMentorIdsWithSlides(): Promise<Set<string>> {
  const ids = new Set<string>();
  let continuationToken: string | undefined;

  do {
    const res = await r2.send(
      new ListObjectsV2Command({
        Bucket: bucketName(),
        Prefix: "mentors/",
        ContinuationToken: continuationToken,
      }),
    );

    for (const obj of res.Contents ?? []) {
      const [, mentorId, dir, filename, ...rest] = (obj.Key ?? "").split("/");
      if (rest.length === 0 && mentorId && dir === "slide" && isPdfFilename(filename)) {
        ids.add(mentorId);
      }
    }

    continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (continuationToken);

  return ids;
}

// ブラウザ内で表示させるため Content-Disposition を inline で上書きする
export async function createSlideViewUrl(mentorId: string, filename: string): Promise<string> {
  return getSignedUrl(
    r2,
    new GetObjectCommand({
      Bucket: bucketName(),
      Key: slideKey(mentorId, filename),
      ResponseContentType: "application/pdf",
      ResponseContentDisposition: `inline; filename*=UTF-8''${encodeURIComponent(filename)}`,
    }),
    { expiresIn: VIEW_URL_TTL_SECONDS },
  );
}
