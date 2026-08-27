import { createClient } from "@/lib/supabase/server";

// admin専用のServer Action共通ガード。
// 呼び出し元は { error } が返ってきたらそのまま返す想定。
// 判定はログイン中セッション（RLS配下）のprofiles.roleで行うため、
// service roleクライアントより先に必ずこれを通すこと。
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "ログインが必要です。" };

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || profile?.role !== "admin") {
    return { error: "権限がありません。" };
  }

  return { user };
}
