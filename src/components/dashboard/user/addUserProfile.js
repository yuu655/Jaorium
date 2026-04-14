"use client";
import { useActionState, useEffect } from "react";

export default function AddUserProfile({
  profile,
  onUpload,
  setIsIcon = null,
}) {
  // const wrappedAction = setIsIcon
  //   ? (prevState, formData) => onUpload(prevState, formData, setIsIcon)
  //   : onUpload;

  const [state, action, isPending] = useActionState(onUpload, null);

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
