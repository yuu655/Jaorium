import { createClient } from "@supabase/supabase-js";

// service-roleキーを使うクライアント。RLSをバイパスするため、信頼できる
// サーバー側処理（webhook・cronジョブ等）からのみ呼び出すこと。
export function createAdminSupabaseClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_SECRET_KEY);
}
