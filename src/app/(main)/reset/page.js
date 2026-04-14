"use client";
import { resetPassword } from "./action";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useState, useActionState } from "react";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
export default function LoginPage() {

    //   const [isLoading, setIsLoading] = useState(false);
    const handleResetPassword = async (prevState, formData) => {
        const result = await resetPassword(prevState, formData);
        if (result?.error) {
            toast.error(result.error);
        } else if (result?.success) {
            toast.success("再設定用のメールを送信しました。受信箱を確認してください！");
        }
    };
    const [state, action, isPending] = useActionState(handleResetPassword, null);
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
                        ログインして、メンターと繋がりましょう
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
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
                        {/* <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                再設定用のパスワード
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
                        </div> */}

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
                            {isPending ? "試行中" : "パスワード再設定"}
                        </button>
                    </form>
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
