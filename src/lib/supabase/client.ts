import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "./database.types";

export type SupabaseBrowserClient = ReturnType<typeof createBrowserClient<Database>>;

let client: SupabaseBrowserClient | null = null;

// 環境変数は呼び出し時に読む（モジュール評価時に読むとテストのstubEnvより先に
// 固定されてしまう）。欠けていればSupabase側で即エラーになるので、ここでは
// 挙動を変えないよう非nullアサーションのみに留める。
export function createClient(): SupabaseBrowserClient {
  if (client) return client;
  const browser = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );

  // supabase-js が realtime.setAuth() を呼ぶのは SIGNED_IN / TOKEN_REFRESHED の
  // ときだけで、ページ読み込み時のセッション復元（INITIAL_SESSION）では呼ばれない。
  // その間 Realtime は publishable key のまま動き、postgres_changes の行が
  // すべてRLSで落とされる（購読自体はSUBSCRIBEDになるのでエラーも出ない）。
  // ここで明示的に渡して、リロード直後から購読が効くようにする。
  browser.auth.onAuthStateChange((_event, session) => {
    if (session?.access_token) browser.realtime.setAuth(session.access_token);
  });

  client = browser;
  return client;
}
