"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function validatePassword(password, passwordCheck) {
  if (!password || password.length < 6) {
    return "パスワードは6文字以上で入力してください。";
  }
  if (password !== passwordCheck) {
    return "再入力のパスワードと一致しません";
  }
  return null;
}

async function updatePassword(supabase, password) {
  return supabase.auth.updateUser({ password });
}

function translateUpdatePasswordError(error) {
  // リセットメールのリンクが古い等でセッションがない場合
  if (error.message?.toLowerCase().includes("session")) {
    return "セッションの有効期限が切れています。もう一度パスワードリセットをやり直してください。";
  }
  return "パスワードの再設定に失敗しました。もう一度お試しください。";
}

export async function resetPass(prevState, formData) {
  const supabase = await createClient();
  const password = formData.get("password");
  const passwordCheck = formData.get("password_check");

  const validationError = validatePassword(password, passwordCheck);
  if (validationError) {
    return { error: validationError };
  }

  const { error } = await updatePassword(supabase, password);

  // 「現在のパスワードと同じ」は、望むパスワードが既に設定されている状態なので
  // 成功として扱う（従来はここでエラーになり、ページ側のバグと合わさって
  // エラーページに飛んでいた）
  const isSamePassword = error?.message?.includes("different from the old password");

  if (error && !isSamePassword) {
    console.error("resetPass updateUser error:", error.message); // サーバーログ用
    return { error: translateUpdatePasswordError(error) };
  }

  revalidatePath("/", "layout");
  redirect("/setAccount"); // 成功時はリダイレクト
}
