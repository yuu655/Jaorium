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

  const { data: { user }, error } = await supabase.auth.signInWithPassword(data);
  // ログイン成功後のユーザーデータを確認
  if (user.user_metadata.role !== undefined) {
    return( {error: "アカウント登録が途中で終了しています。もう一度サインアップしてください。"} )
  }

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

export async function signup(prevState, formData) {
  const supabase = await createClient();
  const data = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const { error } = await supabase.auth.signUp(data);

  if (error) {
    return { error: "サインアップに失敗しました: " + error.message };
  }

  // サインアップ成功時は、メール確認が必要なためリダイレクトせずにメッセージを期待する
  return { success: true };
}
