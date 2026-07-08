"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function translateLoginError(error) {
  if (error.message === "Invalid login credentials") {
    return "メールアドレスまたはパスワードが間違っています。アカウントをお持ちでない場合は新規登録してください。";
  }
  return "ログインに失敗しました";
}

async function signInWithPassword(supabase, { email, password }) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function login(prevState, formData) {
  const supabase = await createClient();
  const email = formData.get("email");
  const password = formData.get("password");

  const { error } = await signInWithPassword(supabase, { email, password });

  if (error) {
    return { error: translateLoginError(error) };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard"); // 成功時はリダイレクト
}

export async function signup(prevState, formData) {
  const supabase = await createClient();
  const email = formData.get("email");
  const password = formData.get("password");

  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: "サインアップに失敗しました: " + error.message };
  }

  // サインアップ成功時は、メール確認が必要なためリダイレクトせずにメッセージを期待する
  return { success: true };
}
