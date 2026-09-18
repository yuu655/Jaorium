import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "./database.types";

export type SupabaseServerClient = ReturnType<typeof createServerClient<Database>>;

// 環境変数は呼び出し時に読む（モジュール評価時に読むとテストのstubEnvより先に
// 固定されてしまう）。欠けていればSupabase側で即エラーになるので、ここでは
// 挙動を変えないよう非nullアサーションのみに留める。
export async function createClient(): Promise<SupabaseServerClient> {
  const cookieStore = await cookies();
  // Create a server's supabase client with newly configured cookie,
  // which could be used to maintain user's session
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch (err) {
            console.error("cookie setAll error:", err);
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have proxy refreshing
            // user sessions.
          }
        },
      },
    },
  );
}
