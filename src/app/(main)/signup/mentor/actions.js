"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import getUrls from "@/utils/getUrls";

function translateLoginError(error) {
  if (error.message === "Invalid login credentials") {
    return "メールアドレスまたはパスワードが間違っています。アカウントをお持ちでない場合は新規登録してください。";
  }
  return "ログインに失敗しました";
}

export async function login(prevState, formData) {
  const supabase = await createClient();
  const email = formData.get("email");
  const password = formData.get("password");

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: translateLoginError(error) };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard"); // 成功時はリダイレクト
}

function passwordsMatch(password, confirmPassword) {
  return password === confirmPassword;
}

async function signUpWithPassword(supabase, { email, password, emailRedirectTo }) {
  return supabase.auth.signUp({ email, password, options: { emailRedirectTo } });
}

// 注: このページ (signup/mentor) からは呼ばれておらず、現状どこからもimportされていない。
// パスワード方式の旧サインアップ実装の残骸と見られる。挙動保存のためロジックはそのまま。
export async function signupUser(prevState, formData) {
  const email = formData.get("email");
  const password = formData.get("password");
  const confirmPassword = formData.get("password_check");

  if (!passwordsMatch(password, confirmPassword)) {
    return { error: "再入力のパスワードと一致しません" };
  }

  const supabase = await createClient();
  const { error } = await signUpWithPassword(supabase, {
    email,
    password,
    emailRedirectTo: `${getUrls()}/api/auth/confirm?next=/setAccount/user`,
  });

  if (error) {
    return { error: "サインアップに失敗しました: " + error.message };
  }

  // サインアップ成功時は、メール確認が必要なためリダイレクトせずにメッセージを期待する
  return { success: true };
}

async function checkEmailExists(email) {
  const masterSupabase = createAdminSupabaseClient();
  return masterSupabase.rpc("email_exists", { check_email: email });
}

async function sendMentorSignupOtp(supabase, email) {
  return supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${getUrls()}/api/auth/confirm?next=/setAccount/mentor`,
    },
  });
}

export async function signupMentor(prevState, formData) {
  const supabase = await createClient();
  const email = formData.get("email");

  const { data: exists, error: rpcError } = await checkEmailExists(email);

  if (rpcError) {
    console.error("email_exists error:", rpcError.message);
    return { success: false, error: "確認に失敗しました。" };
  }

  if (exists) {
    return { success: false, error: "このメールアドレスは既に登録されています。" };
  }

  const { error } = await sendMentorSignupOtp(supabase, email);

  if (error) {
    return { error: "サインアップに失敗しました: " + error.message };
  }

  // サインアップ成功時は、メール確認が必要なためリダイレクトせずにメッセージを期待する
  return { success: true };
}

function translateVerifyOtpError(error) {
  if (error.message.includes("expired")) {
    return "コードの有効期限が切れています。再送信してください。";
  }
  if (error.message.includes("invalid")) {
    return "コードが正しくありません。";
  }
  return "認証に失敗しました。もう一度お試しください。";
}

async function verifyEmailOtp(supabase, { email, token }) {
  return supabase.auth.verifyOtp({ email, token, type: "email" });
}

export async function handleVerifyOtp(prevState, formData) {
  const token = formData.get("token");
  const email = formData.get("email");
  if (!token || !email) {
    return { success: false, error: "コードを入力してください。" };
  }

  const supabase = await createClient();
  const { error } = await verifyEmailOtp(supabase, { email, token });

  if (error) {
    console.error("verifyOtp error:", error.message); // サーバーログ用
    return { success: false, error: translateVerifyOtpError(error) };
  }

  redirect("/setAccount/mentor");
  return { success: true };
}
