"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function passwordsMatch(password, passwordCheck) {
  return password === passwordCheck;
}

async function updatePassword(supabase, password) {
  return supabase.auth.updateUser({ password });
}

export async function resetPass(prevState, formData) {
  const supabase = await createClient();
  const password = formData.get("password");
  const passwordCheck = formData.get("password_check");

  if (!passwordsMatch(password, passwordCheck)) {
    return { error: "再入力のパスワードと一致しません" };
  }

  const { error } = await updatePassword(supabase, password);

  if (error) {
    return { error: "ログインに失敗しました" };
  }

  revalidatePath("/", "layout");
  redirect("/setAccount"); // 成功時はリダイレクト
}
