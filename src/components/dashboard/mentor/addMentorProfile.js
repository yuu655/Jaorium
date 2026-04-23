"use client";
import { useActionState, useState, useEffect } from "react";
import { Eye, Lock, EyeOff } from "lucide-react";

export default function AddMentorProfile({
  profile,
  onUpload,
  mentorTags=[],
  allTags,
  setIsIcon = null,
  user,
  isFirst = false,
}) {
  // const wrappedAction = setIsIcon
  //   ? (prevState, formData) => onUpload(prevState, formData, setIsIcon)
  //   : onUpload;
  const [state, action, isPending] = useActionState(onUpload, null);
  const [selected, setSelected] = useState(mentorTags.map((t) => t.id) || []);
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword_check, setShowPassword_check] = useState(false);

  const toggle = (tag) => {
    const next = selected.includes(tag.id)
      ? selected.filter((id) => id !== tag.id)
      : [...selected, tag.id];
    setSelected(next);
  };

  useEffect(() => {
    if (state?.success && setIsIcon) {
      setIsIcon(true);
    }
  }, [state]);

  // カテゴリごとにグループ化
  const groupedTags = allTags.reduce((acc, tag) => {
    if (!acc[tag.category]) acc[tag.category] = [];
    acc[tag.category].push(tag);
    return acc;
  }, {});

  // useEffect(() => {
  //   if (state?.success && setIsIcon) {
  //     setIsIcon(true);
  //   }
  // }, [state]);

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
          <label
            htmlFor="university"
            className="block text-sm font-medium mb-2"
          >
            大学
          </label>
          <input
            type="text"
            id="university"
            name="university"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="○○大学"
            defaultValue={profile?.university || ""}
          />
        </div>

        <div className="mb-6">
          <label htmlFor="faculty" className="block text-sm font-medium mb-2">
            学部
          </label>
          <input
            type="text"
            id="faculty"
            name="faculty"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="○○学部"
            defaultValue={profile?.faculty || ""}
          />
        </div>

        <div className="mb-6">
          <label htmlFor="quote" className="block text-sm font-medium mb-2">
            アピールポイント
          </label>
          <input
            type="text"
            id="quote"
            name="quote"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="例：逆転合格の秘訣"
            defaultValue={profile?.quote || ""}
          />
        </div>

        <div className="mb-6">
          <label htmlFor="bio" className="block text-sm font-medium mb-2">
            詳細
          </label>
          <textarea
            id="bio"
            name="bio"
            defaultValue={profile?.bio || ""}
            rows={5}
            placeholder="例：高3夏までE判定。部活引退後からの猛勉強で合格をつかみました。効率的な勉強法には自信があります！"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none"
          />
        </div>

        {/* <div className="mb-6">
          <label htmlFor="region" className="block text-sm font-medium mb-2">
            出身地域
          </label>
          <select
            id="region"
            name="region"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            defaultValue={profile?.region || ""}
          >
            <option value="">選択してください</option>
            <option>北海道・東北</option>
            <option>関東</option>
            <option>中部</option>
            <option>関西</option>
            <option>中国・四国</option>
            <option>九州・沖縄</option>
          </select>
        </div> */}

        {selected.map((id) => (
          <input key={id} type="hidden" name="tagIds" value={id} />
        ))}

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">タグ</label>
          <div className="border border-gray-300 rounded-lg px-4 py-3 space-y-4">
            {Object.entries(groupedTags).map(([category, tags]) => (
              <div key={category}>
                <p className="text-xs text-gray-500 mb-2">{category}</p>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => {
                    const isSelected = selected.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggle(tag)}
                        className={`px-3 py-1 rounded-full text-sm border transition-all ${
                          isSelected
                            ? "bg-black text-white border-black"
                            : "bg-white text-gray-700 border-gray-300 hover:border-black"
                        }`}
                      >
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {selected.length > 0 && (
            <p className="mt-2 text-xs text-gray-500">
              選択中：
              {allTags
                .filter((t) => selected.includes(t.id))
                .map((t) => t.name)
                .join("・")}
            </p>
          )}
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
