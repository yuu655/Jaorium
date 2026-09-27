"use server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { revalidatePath, revalidateTag } from "next/cache";
import { MAX_SLIDE_BYTES, createSlideUploadUrl, isPdfFilename, isSafePathSegment } from "@/lib/mentorSlides";

// mentor_secret.admin_allow は本人UPDATE不可（メンターが自分で公開状態を切り替え
// られないようにするため）なので、admin確認後にservice roleで更新する。
export async function setMentorAdminAllow(mentorId, allow) {
  const auth = await requireAdmin();
  if (auth.error) return auth;

  if (!mentorId) return { error: "メンターが指定されていません。" };
  if (typeof allow !== "boolean") return { error: "承認状態の指定が不正です。" };

  const masterSupabase = createAdminSupabaseClient();
  const { error } = await masterSupabase
    .from("mentor_secret")
    .update({ admin_allow: allow })
    .eq("id", mentorId);

  if (error) {
    console.error("setMentorAdminAllow error:", error.message);
    return { error: "承認状態の更新に失敗しました。" };
  }

  revalidatePath("/dashboard/admin/mentors");
  // 公開メンター一覧（public_mentorsビュー）はadmin_allowで絞り込んだ結果を
  // "mentors"タグ付きで1時間キャッシュしているため、ここで明示的に破棄する
  revalidateTag("mentors");

  return { success: true };
}

// メンターのスライドPDFを非公開R2バケットへ直接PUTするための署名付きURLを発行する。
// ファイル本体はServer Actionを経由させず、ブラウザから署名付きURLへ送る。
export async function createMentorSlideUploadUrl(mentorId, filename, size) {
  const auth = await requireAdmin();
  if (auth.error) return auth;

  if (!isSafePathSegment(mentorId)) return { error: "メンターが指定されていません。" };
  if (!isPdfFilename(filename)) return { error: "PDFファイル（.pdf）を選択してください。" };
  if (!Number.isInteger(size) || size <= 0 || size > MAX_SLIDE_BYTES) {
    return { error: `ファイルサイズは${MAX_SLIDE_BYTES / 1024 / 1024}MB以下にしてください。` };
  }

  // 存在しないIDのディレクトリをR2に作らせない
  const masterSupabase = createAdminSupabaseClient();
  const { data: mentor, error } = await masterSupabase
    .from("mentors")
    .select("id")
    .eq("id", mentorId)
    .maybeSingle();

  if (error) {
    console.error("createMentorSlideUploadUrl error:", error.message);
    return { error: "メンター情報の取得に失敗しました。" };
  }
  if (!mentor) return { error: "メンターが見つかりません。" };

  try {
    const url = await createSlideUploadUrl(mentorId, filename, size);
    return { url };
  } catch (e) {
    console.error("createSlideUploadUrl error:", e);
    return { error: "アップロードURLの発行に失敗しました。" };
  }
}
