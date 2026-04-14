"use client";

import { useRef, useState } from "react";

export default function AvatarUpload({
  handleFileChange,
  uploadAvatar,
  uploading,
  previewUrl,
  profile,
}) {
  const fileInputRef = useRef(null);
  const [name, setName] = useState(profile?.name || "");

  return (
    <div>
      <label htmlFor="icon" className="block text-sm font-medium mb-2">
        プロフィール画像
      </label>
      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm flex flex-col items-center gap-8">
        <div
          className="relative w-32 h-32 cursor-pointer group"
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="プレビュー"
              className="w-32 h-32 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-gray-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                />
              </svg>
            </div>
          )}
          <div className="absolute inset-0 rounded-full bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 gap-1">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
              />
            </svg>
            <span className="text-white text-xs font-medium">変更</span>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          id="icon"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full max-w-xs px-6 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          画像ファイルを選択
        </button>

        <p className="text-sm text-gray-400 text-center -mt-4">
          JPG・PNG・GIF に対応　／　推奨サイズ：400 × 400px 以上
        </p>

        <button
          type="button"
          onClick={uploadAvatar}
          disabled={uploading || !previewUrl}
          className="w-full max-w-xs px-6 py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 active:scale-95 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                />
              </svg>
              アップロード中...
            </span>
          ) : (
            "この画像で確定する"
          )}
        </button>
      </div>
    </div>
  );
}
