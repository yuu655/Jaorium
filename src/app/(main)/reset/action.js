"use server";
import { createClient } from "@/lib/supabase/server";
import { isValidEmail } from "@/lib/validateEmail";
import getUrls from "@/utils/getUrls";

function translateResetPasswordError(error) {
  if (error.message.includes("rate limit") || error.status === 429) {
    // ユーザーに待つよう伝える
    return "しばらく時間をおいてから再度お試しください";
  }
  return `${error.message}メールの送信に失敗しました`;
}

async function sendResetPasswordEmail(supabase, email) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getUrls()}/api/auth/resetpass`,
  });
}

export async function resetPassword(prevState, formData) {
  const supabase = await createClient();
  const email = formData.get("email");

  // 不正な形式のアドレスはSMTP送信段階で500になるため、送信前に弾く
  if (!isValidEmail(email)) {
    return {
      error: "メールアドレスの形式が正しくありません。入力内容をご確認ください。",
    };
  }

  // メール/パスワードユーザーのみリセットメール送信
  const { error } = await sendResetPasswordEmail(supabase, email);

  if (error) {
    return { error: translateResetPasswordError(error) };
  }

  return { success: true };
}
