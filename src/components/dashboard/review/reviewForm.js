"use client";

import { useActionState, useState } from "react";

export default function ReviewForm({ func }) {
  const [state, action, isPending] = useActionState(func, null);
  const [stars, setStars] = useState(0);
  const [hovered, setHovered] = useState(0);

  return (
    <>
      {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
      <form action={action} className="space-y-8">
        <div className="p-6 space-y-6">
          {/* 星評価 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              評価 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-1">
              {Array.from({ length: 5 }, (_, idx) => idx + 1).map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setStars(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  className="text-3xl transition-colors"
                >
                  {star <= (hovered || stars) ? "★" : "☆"}
                </button>
              ))}
            </div>
            {/* hidden input で stars の値をフォームに含める */}
            <input type="hidden" name="stars" value={stars} />
            {state?.errors?.stars && (
              <p className="text-sm text-red-500">{state.errors.stars}</p>
            )}
          </div>

          {/* コメント */}
          <div className="space-y-2">
            <label
              htmlFor="comments"
              className="block text-sm font-medium text-gray-700"
            >
              コメント
            </label>
            <textarea
              id="comments"
              name="comments"
              rows={4}
              placeholder="レビューを入力してください"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {state?.errors?.comments && (
              <p className="text-sm text-red-500">{state.errors.comments}</p>
            )}
          </div>
        </div>

        {/* 送信ボタン */}
        <div className="px-6">
          <button
            type="submit"
            disabled={isPending || stars === 0}
            className="w-full px-8 py-4 bg-blue-600 text-white text-lg font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isPending ? "送信中..." : "登録する"}
          </button>
        </div>
      </form>
    </>
  );
}
