"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function validatePassword(password, passwordCheck) {
  if (!password || password.length < 6) {
    return "パスワードは6文字以上で入力してください。";
  }
  if (password !== passwordCheck) {
    return "再入力のパスワードと一致しません。";
  }
  return null;
}

// setAccount/actions.jsのmarkProfileAsSetと同じ「オンボーディング完了フラグ」
async function markProfileAsSet(supabase, userId) {
  const { error } = await supabase.from("profiles").update({ set: true }).eq("id", userId);
  return { error };
}

export async function setOwnerPassword(prevState, formData) {
  const password = formData.get("password");
  const passwordCheck = formData.get("password_check");

  const validationError = validatePassword(password, passwordCheck);
  if (validationError) {
    return { error: validationError };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.updateUser({ password });

  if (error) {
    console.error("setOwnerPassword error:", error.message);
    return { error: "パスワードの設定に失敗しました。もう一度お試しください。" };
  }

  const { error: profileError } = await markProfileAsSet(supabase, data.user.id);
  if (profileError) {
    console.error("setOwnerPassword profiles update error:", profileError.message);
    return { error: "パスワードは設定されましたが、状態の更新に失敗しました。もう一度お試しください。" };
  }

  redirect("/dashboard/organization");
}
