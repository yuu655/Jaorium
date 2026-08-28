"use client";

import { useSyncExternalStore } from "react";
import { X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";

// 項目数が多いカテゴリだけ件数を添える(デザイン上「得意教科 13項目」のような見せ方)。
const COUNT_HINT_THRESHOLD = 8;

const DESKTOP_QUERY = "(min-width: 1024px)";

const subscribeToDesktop = (onChange) => {
  const mql = window.matchMedia(DESKTOP_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
};

// Sheetのside(=スライド方向)は文字列で渡す必要があるため、CSSのbreakpointではなくJSで判定する。
// アニメーションをレスポンシブに上書きするとRadixのアンマウント待ちが終わらず、閉じられなくなる。
const useIsDesktop = () =>
  useSyncExternalStore(
    subscribeToDesktop,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  );

const CHIP_BASE =
  "rounded-full border px-3.5 py-2 text-xs leading-none whitespace-nowrap transition-colors";

export const chipClassName = (selected) =>
  selected
    ? `${CHIP_BASE} border-[#2563EB] bg-[#2563EB] font-bold text-white`
    : `${CHIP_BASE} border-[#E4E7EB] bg-white text-[#4B5563] hover:border-[#2563EB] hover:text-[#2563EB]`;

/**
 * 絞り込みパネル。モバイルは下から出るボトムシート、lg以上は右からのサイドパネル。
 * 開閉・フォーカストラップ・背面スクロール固定はshadcnのSheet(Radix Dialog)に任せる。
 */
export default function MentorFilterSheet({
  open,
  onOpenChange,
  tagGroups,
  selectedTags,
  toggleTag,
  clearTags,
  resultCount,
}) {
  const isDesktop = useIsDesktop();
  const hasSelection = selectedTags.length > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        showCloseButton={false}
        className={[
          "flex flex-col gap-0 bg-white p-0",
          isDesktop
            ? "w-110 max-w-none border-l border-[#E4E7EB] shadow-[-12px_0_32px_rgba(31,35,40,.12)] sm:max-w-none"
            : "max-h-[85dvh] rounded-t-2xl border-0 shadow-[0_-8px_28px_rgba(31,35,40,.18)]",
        ].join(" ")}
      >
        {/* モバイルのつまみ */}
        <div className="flex justify-center pt-3 lg:hidden">
          <div className="h-1 w-10 rounded-full bg-[#E4E7EB]" />
        </div>

        <div className="flex items-center justify-between border-b border-[#ECEEF1] px-5 py-3.5 lg:px-6.5 lg:py-5">
          <SheetTitle className="text-base font-bold text-[#1F2328] lg:text-[17px]">
            絞り込み
          </SheetTitle>
          <SheetDescription className="sr-only">
            タグを選んでメンターを絞り込みます。選んだタグをすべて持つメンターだけが表示されます。
          </SheetDescription>
          <div className="flex items-center gap-3.5 lg:gap-4">
            <button
              type="button"
              onClick={clearTags}
              disabled={!hasSelection}
              className="text-xs font-medium text-[#2F5FD0] transition-opacity hover:underline disabled:opacity-40 disabled:hover:no-underline"
            >
              すべて解除
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="絞り込みを閉じる"
              className="flex size-8 items-center justify-center rounded-lg border border-[#E4E7EB] text-[#1F2328] transition-colors hover:bg-[#F9FAFC]"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-3.5 lg:px-6.5 lg:pb-3">
          {tagGroups.map((group) => (
            <div
              key={group.label}
              className="border-b border-[#F1F2F4] py-4.5 last:border-b-0"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[13px] leading-none font-bold text-[#1F2328]">
                  {group.label}
                </span>
                {group.tags.length >= COUNT_HINT_THRESHOLD && (
                  <span className="text-[11px] leading-none text-[#6B7280]">
                    {group.tags.length}項目
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {group.tags.map((tag) => {
                  const selected = selectedTags.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      aria-pressed={selected}
                      className={chipClassName(selected)}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3.5 border-t border-[#ECEEF1] bg-white px-5 pt-3.5 pb-6 lg:px-6.5">
          <p className="w-19 flex-none text-[11px] leading-snug text-[#4B5563]">
            <span className="text-xl font-bold text-[#1F2328]">
              {resultCount}
            </span>
            {" 名"}
            <br />
            該当
          </p>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex-1 rounded-lg bg-[#2563EB] py-4.25 text-[15px] leading-none font-bold text-white transition-colors hover:bg-[#1D4ED8]"
          >
            この条件で表示する
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
