"use client";
import { useState, useRef } from "react";

// ── スライドビューアー ────────────────────────────────────
export function SlideViewer({
  slides,
  currentPage,
  isLocalPresenter,
  onPageChange,
  onStop,
  onUpload,
  isPresenting,
}) {
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      await onUpload(file);
    } catch (err) {
      setError(err.message || "読み込みに失敗しました");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const currentSlide = slides[currentPage];

  // ── 発表中でないとき: アップロードボタン ──────────────
  if (!isPresenting) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-6">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center">
          <PresentationIcon className="w-8 h-8 text-blue-400" />
        </div>
        <p className="text-white/60 text-sm text-center">
          PDF・画像をアップロードして<br />資料を全員に共有できます
        </p>
        {error && (
          <p className="text-red-400 text-xs text-center">{error}</p>
        )}
        <button
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
        >
          {uploading ? (
            <>
              <SpinnerIcon className="w-4 h-4 animate-spin" />
              送信中...
            </>
          ) : (
            <>
              <UploadIcon className="w-4 h-4" />
              資料をアップロード
            </>
          )}
        </button>
        <p className="text-white/30 text-xs">PDF、PNG、JPEG に対応</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.gif,.webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    );
  }

  // ── 発表中: スライド表示 ──────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* スライド本体 */}
      <div className="flex-1 relative bg-black rounded-xl overflow-hidden flex items-center justify-center">
        {currentSlide ? (
          <img
            src={currentSlide.dataUrl}
            alt={`スライド ${currentPage + 1}`}
            className="w-full h-full object-contain"
            draggable={false}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-white/30">
            <SpinnerIcon className="w-6 h-6 animate-spin" />
            <p className="text-xs">読み込み中...</p>
          </div>
        )}

        {/* ページ番号バッジ */}
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1 text-white/60 text-xs tabular-nums">
          {currentPage + 1} / {slides.length}
        </div>
      </div>

      {/* コントロール */}
      {isLocalPresenter && (
        <div className="flex-none flex items-center gap-2 pt-3">
          {/* 前へ */}
          <button
            disabled={currentPage === 0}
            onClick={() => onPageChange(currentPage - 1)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white transition-colors"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>

          {/* サムネイルスクロール */}
          <div className="flex-1 flex gap-1.5 overflow-x-auto py-1 scrollbar-none">
            {slides.map((slide, i) => (
              <button
                key={i}
                onClick={() => onPageChange(i)}
                className={`flex-none w-14 h-9 rounded-md overflow-hidden border-2 transition-all
                  ${i === currentPage ? "border-blue-400" : "border-transparent opacity-50 hover:opacity-80"}`}
              >
                <img
                  src={slide.dataUrl}
                  alt={`${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>

          {/* 次へ */}
          <button
            disabled={currentPage === slides.length - 1}
            onClick={() => onPageChange(currentPage + 1)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white transition-colors"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>

          {/* 終了 */}
          <button
            onClick={onStop}
            className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
            title="発表終了"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── アイコン ─────────────────────────────────────────────
const PresentationIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3h16.5M3.75 3v11.25A2.25 2.25 0 006 16.5h12a2.25 2.25 0 002.25-2.25V3M3.75 3H2.25M20.25 3h1.5M9 20.25l3-3 3 3M12 17.25V21" />
  </svg>
);
const UploadIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>
);
const ChevronLeftIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);
const ChevronRightIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);
const XIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const SpinnerIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);
