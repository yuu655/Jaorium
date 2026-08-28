"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { getPageItems } from "@/lib/pagination";

export default function Pagination({
  page,
  totalPages,
  onPageChange,
  label = "ページ送り",
}) {
  if (totalPages <= 1) return null;

  const items = getPageItems(page, totalPages);

  const baseButton =
    "min-w-10 h-10 px-3 flex items-center justify-center rounded-lg border text-sm transition-colors";

  return (
    <nav
      aria-label={label}
      className="flex flex-wrap items-center justify-center gap-2 mt-12"
    >
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="前のページ"
        className={`${baseButton} border-gray-200 text-gray-600 hover:border-blue-400 disabled:opacity-40 disabled:hover:border-gray-200 disabled:cursor-not-allowed`}
      >
        <ChevronLeft size={18} />
      </button>

      {items.map((item, index) =>
        item === "ellipsis" ? (
          <span
            key={`ellipsis-${index}`}
            className="min-w-10 h-10 flex items-center justify-center text-gray-400"
          >
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            aria-current={item === page ? "page" : undefined}
            className={`${baseButton} ${
              item === page
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-700 border-gray-200 hover:border-blue-400"
            }`}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="次のページ"
        className={`${baseButton} border-gray-200 text-gray-600 hover:border-blue-400 disabled:opacity-40 disabled:hover:border-gray-200 disabled:cursor-not-allowed`}
      >
        <ChevronRight size={18} />
      </button>
    </nav>
  );
}
