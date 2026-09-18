import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

export type SupabaseAdminClient = ReturnType<typeof createClient<Database>>;

// service-roleキーを使うクライアント。RLSをバイパスするため、信頼できる
// サーバー側処理（webhook・cronジョブ等）からのみ呼び出すこと。
//
// 環境変数は呼び出し時に読む（モジュール評価時に読むとテストのstubEnvより先に
// 固定されてしまう）。欠けていればSupabase側で即エラーになるので、ここでは
// 挙動を変えないよう非nullアサーションのみに留める。
export function createAdminSupabaseClient(): SupabaseAdminClient {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_SECRET_KEY!,
  );
}
