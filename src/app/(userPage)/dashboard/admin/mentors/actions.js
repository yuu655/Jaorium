"use server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { revalidatePath, revalidateTag } from "next/cache";

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
