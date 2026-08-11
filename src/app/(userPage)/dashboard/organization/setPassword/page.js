"use client";

import { useState, useActionState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import { setOwnerPassword } from "./actions";
import { FormError } from "@/components/ui/form-error";

// 組織owner招待メールのリンク先（招待メールのredirectToがここを指す）。
// 通常ログインとは別に、パスワード未設定の招待アカウント専用の設定画面として用意している。
export default function SetOwnerPasswordPage() {
  const [state, action, isPending] = useActionState(setOwnerPassword, null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordCheck, setShowPasswordCheck] = useState(false);

  return (
    <div className="bg-linear-to-br from-gray-50 to-gray-100 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">JaoRium</h1>
          <p className="text-gray-600">組織アカウントのパスワードを設定してください</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <FormError message={state?.error} />
          <form action={action} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
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

            <div>
              <label htmlFor="password_check" className="block text-sm font-medium text-gray-700 mb-2">
                パスワード再入力
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={20} className="text-gray-400" />
                </div>
                <input
                  id="password_check"
                  name="password_check"
                  type={showPasswordCheck ? "text" : "password"}
                  required
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordCheck(!showPasswordCheck)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPasswordCheck ? (
                    <EyeOff size={20} className="text-gray-400" />
                  ) : (
                    <Eye size={20} className="text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isPending ? "設定中..." : "パスワードを設定する"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
