"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(prevState, formData) {
  const supabase = await createClient();
  const data = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    if (error.message === "Invalid login credentials") {
      return {
        error:
          "メールアドレスまたはパスワードが間違っています。アカウントをお持ちでない場合は新規登録してください。",
      };
    }
    return { error: "ログインに失敗しました" };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard"); // 成功時はリダイレクト
}

export async function signup_user(prevState, formData) {
  const supabase = await createClient();
  const data = {
    email: formData.get("email"),
    password: formData.get("password"),
    confirm_password: formData.get("password_check"),
  };
  if(data.password !== data.password){
    return {error: "再入力のパスワードと一致しません"}
  }

  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      emailRedirectTo: "https://www.jaorium.com/api/auth/confirm?next=/setAccount/user"
    }
  });

  if (error) {
    return { error: "サインアップに失敗しました: " + error.message };
  }

  // サインアップ成功時は、メール確認が必要なためリダイレクトせずにメッセージを期待する
  return { success: true };
}

export async function signup_mentor(prevState, formData) {
  const supabase = await createClient();
  const data = {
    email: formData.get("email"),
    password: formData.get("password"),
    confirm_password: formData.get("password_check"),
  };
  if(data.password !== data.password){
    return {error: "再入力のパスワードと一致しません"}
  }

  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      emailRedirectTo: "https://www.jaorium.com/api/auth/confirm?next=/setAccount/mentor"
    }
  });

  if (error) {
    return { error: "サインアップに失敗しました: " + error.message };
  }

  // サインアップ成功時は、メール確認が必要なためリダイレクトせずにメッセージを期待する
  return { success: true };
}


