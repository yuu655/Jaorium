"use server";

import { createClient } from "@/lib/supabase/server";

export default async function Acount() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id)
    .single();
  // console.log(profile.role)
  return (
    <>
      <div>あなたは{profile.role}です。</div>

      <form action="/auth/signout" method="post">
        <button className="button block" type="submit">
          Sign out
        </button>
      </form>
    </>
  );
}
