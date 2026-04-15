"use client";
import { useActionState, useEffect } from "react";

export default function AddUserProfile({
  profile,
  onUpload,
  setIsIcon = null,
  user,
  isFirst = false,
}) {
  // const wrappedAction = setIsIcon
  //   ? (prevState, formData) => onUpload(prevState, formData, setIsIcon)
  //   : onUpload;

  const [state, action, isPending] = useActionState(onUpload, null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword_check, setShowPassword_check] = useState(false);

  useEffect(() => {
    console.log(setIsIcon, state);
    if (state?.success && setIsIcon) {
      setIsIcon(true);
    }
  }, [state]);

  return (
    <>
      {state?.error && <p className="text-red-500 text-sm">{state.error}</p>}
      <form action={action}>
        <div className="mb-6">
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            ユーザーネーム
          </label>
          <input
            type="text"
            id="name"
            name="name"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="山田 太郎"
            required
            defaultValue={profile?.name || ""}
          />
        </div>

        {(user?.app_metadata?.provider === "email" && isFirst) && (
          <>
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
          </>
        )}



        <div className="mb-6">
          <label htmlFor="grade" className="block text-sm font-medium mb-2">
            学年
          </label>
          <select
            id="grade"
            name="grade"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            defaultValue={profile?.grade || ""}
          >
            <option value="">選択してください</option>
            <option>高校3年生</option>
            <option>高校2年生</option>
            <option>高校1年生</option>
            <option>浪人生</option>
            <option>その他</option>
          </select>
        </div>

        <div className="mb-6">
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            現在の志望校や、興味のある進路など（任意）
          </label>
          <input
            type="text"
            id="desire"
            name="desire"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="○○大学 ○○学部 など"
            defaultValue={profile?.desire || ""}
          />
        </div>

        <div className="mb-6">
          <button
            type="submit"
            disabled={isPending}
            className="w-full px-8 py-4 bg-blue-600 text-white text-lg font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            {isPending ? "送信中..." : "登録する"}
          </button>
        </div>
      </form>
    </>
  );
}
