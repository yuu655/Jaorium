"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import getUrls from "@/utils/getUrls";

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
  const masterSupabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_SECRET_KEY,
  );
  const data = {
    email: formData.get("email"),
  };
  const { data: exists, error: rpcError } = await masterSupabase.rpc(
    "email_exists",
    {
      check_email: data.email,
    },
  );

  if (rpcError) {
    console.error("email_exists error:", rpcError.message);
    return { success: false, error: "確認に失敗しました。" };
  }

  if (exists) {
    return {
      success: false,
      error: "このメールアドレスは既に登録されています。",
    };
  }
  // if(data.password !== data.confirm_password){
  //   return {error: "再入力のパスワードと一致しません"}
  // }

  // const { error } = await supabase.auth.signUp({
  //   email: data.email,
  //   password: data.password,
  //   options: {
  //     emailRedirectTo: "https://www.jaorium.com/api/auth/confirm?next=/setAccount/user"
  //   }
  // });
  const { error } = await supabase.auth.signInWithOtp({
    email: data.email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${getUrls()}/api/auth/confirm?next=/setAccount/user`,
    },
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
  if (data.password !== data.password) {
    return { error: "再入力のパスワードと一致しません" };
  }

  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      emailRedirectTo: `${getUrls()}/api/auth/confirm?next=/setAccount/mentor`,
    },
  });

  await supabase.auth.updateUser({ data: { role: "user" } });

  if (error) {
    return { error: "サインアップに失敗しました: " + error.message };
  }

  // サインアップ成功時は、メール確認が必要なためリダイレクトせずにメッセージを期待する
  return { success: true };
}

export async function handleVerifyOtp(prevState, formData) {
  const supabase = await createClient();
  const token = formData.get("token");
  const email = formData.get("email");
  if (!token || !email) {
    return { success: false, error: "コードを入力してください。" };
  }

  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email", // signup後の検証なら 'signup' または 'email'
  });
//   console.log("data:", data);
// console.log("error:", error);

  if (error) {
    console.error("verifyOtp error:", error.message); // サーバーログ用

    // ユーザー向けには分かりやすいメッセージに変換
    let userMessage = "認証に失敗しました。もう一度お試しください。";
    if (error.message.includes("expired")) {
      userMessage = "コードの有効期限が切れています。再送信してください。";
    } else if (error.message.includes("invalid")) {
      userMessage = "コードが正しくありません。";
    }

    return { success: false, error: userMessage };
  }

  redirect("/setAccount/user");
  return { success: true };
}
