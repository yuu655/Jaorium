"use client";

import { login, signup_user } from "./actions";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useState, useActionState } from "react";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
export default function LoginPage() {

  const handleSignup = async (prevState, formData) => {
    const result = await signup_user(prevState, formData);
    if (result?.error) {
      toast.error(result.error);
    } else if (result?.success) {
      toast.success("認証メールを送信しました。受信箱を確認してください！");
    }
  };
  
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword_check, setShowPassword_check] = useState(false);
  // const [isLoading, setIsLoading] = useState(false);
  const [state, action, isPending] = useActionState(handleSignup, null);
  

  const handleGoogleLogin = async () => {
    //   const [origin, setOrigin] = useState('')

    //   useEffect(() => {
    //     // ここなら絶対安全！
    //     setOrigin(window.location.origin)
    //   }, [])
    const supabase = await createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `https://www.jaorium.com/api/auth/callback?next=/setAccount/user`,
      },
    });
  };

  // const handleLogin = async (formData) => {
  //   setIsLoading(true);
  //   // console.log("aaa")
  //   const result = await login(formData);
  //   if (result?.error) {
  //     setIsLoading(false);
  //     toast.error(result.error);
  //   }
  // };

  return (
    // <>
    //   <form>
    //     <label htmlFor="email">Email:</label>
    //     <input id="email" name="email" type="email" required />

    //     <label htmlFor="password">Password:</label>
    //     <input id="password" name="password" type="password" required />

    //     {/* ログインボタン */}
    //     <button formAction={handleLogin}>Log in</button>

    //     {/* サインアップボタン（成功時のみトーストが出る） */}
    //     <button formAction={handleSignup}>Sign up</button>
    //   </form>
    //   <button
    //     onClick={handleGoogleLogin}
    //     className="bg-blue-500 text-white p-2 rounded"
    //   >
    //     Googleでログイン
    //   </button>
    // </>
    <div className="bg-linear-to-br from-gray-50 to-gray-100 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">        
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold mb-2">JaoRium</h1>
          </Link>
          <p className="text-gray-600">
            サインアップして、メンターと繋がりましょう
          </p>
        </div>
        <h2 className="text-2xl font-bold text-center mb-6">ユーザー登録</h2>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Social Login Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="font-medium text-gray-700">
                Googleでサインアップ
              </span>
            </button>

            {/* <button
              onClick={() => handleSocialLogin("LINE")}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#06C755] text-white rounded-lg hover:bg-[#05b34b] transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
              </svg>
              <span className="font-medium">LINEでログイン</span>
            </button> */}
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">または</span>
            </div>
          </div>

          {/* Email/Password Form */}
          {state?.error && <p className="text-red-500 text-sm">{state.error}</p>}
          <form action={action} className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                メールアドレス
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={20} className="text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="example@email.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                パスワード
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={20} className="text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff size={20} className="text-gray-400" />
                  ) : (
                    <Eye size={20} className="text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password_check"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                パスワード再入力
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={20} className="text-gray-400" />
                </div>
                <input
                  id="password_check"
                  name="password_check"
                  type={showPassword_check ? "text" : "password"}
                  required
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword_check(!showPassword_check)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword_check ? (
                    <EyeOff size={20} className="text-gray-400" />
                  ) : (
                    <Eye size={20} className="text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Privacy Policy Checkbox */}
            <div className="flex items-start gap-3">
              <input
                id="privacy"
                name="privacy"
                type="checkbox"
                required
                className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
              />
              <label htmlFor="privacy" className="text-sm text-gray-600 cursor-pointer">
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 underline underline-offset-2"
                >
                  プライバシーポリシー
                </a>
                に同意する
              </label>
            </div>


            {/* Remember & Forgot */}
            {/* <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="remember"
                  className="ml-2 block text-sm text-gray-700"
                >
                  ログイン状態を保持
                </label>
              </div>
              <a href="#" className="text-sm text-blue-600 hover:text-blue-700">
                パスワードを忘れた方
              </a>
            </div> */}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isPending ? "サインアップ中..." : "サインアップ"}
            </button>
          </form>

          {/* login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              アカウントをお持ちの方は{" "}
              <Link
                href="/login"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                ログイン
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
            ← ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
