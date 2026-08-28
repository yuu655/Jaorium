"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { AUDIENCE_LINKS, NAV_LINKS } from "./navLinks";

export default function HeaderNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // ドロップダウンを開いている間は他のリンクを退かせる（デザインのHOVER状態）。
  const linkColor = open ? "text-[#98A0AA]" : "text-[#1F2328]";

  return (
    <div
      className="relative hidden items-center gap-5 self-stretch lg:flex xl:gap-7"
      onMouseLeave={() => setOpen(false)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      {NAV_LINKS.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          onMouseEnter={() => setOpen(false)}
          className={`text-base font-semibold transition-colors hover:text-blue-600 ${linkColor}`}
        >
          {item.name}
        </Link>
      ))}

      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        onMouseEnter={() => setOpen(true)}
        className={`flex items-center gap-1.5 border-b-2 pb-1 text-base transition-colors ${
          open
            ? "border-blue-600 font-bold text-blue-600"
            : "border-[#D5D9DF] font-semibold text-[#1F2328] hover:border-blue-600 hover:text-blue-600"
        }`}
      >
        各種の方へ
        {open ? (
          <ChevronUp className="size-4.25 text-blue-600" />
        ) : (
          <ChevronDown className="size-4.25 text-[#98A0AA]" />
        )}
      </button>

      <Link
        href="/contact"
        onMouseEnter={() => setOpen(false)}
        
        className={`text-[15px] font-medium transition-colors hover:text-blue-600 ${
          open ? "text-[#98A0AA]" : "text-gray-600"
        }`}
      >
        お問い合わせ
      </Link>

      <span className="h-5.5 w-px bg-[#E4E7EB]" />

      <Link
        href="/login"
        onMouseEnter={() => setOpen(false)}
        className={`text-[15px] font-semibold transition-colors hover:text-[#24499F] ${
          open ? "text-[#8C9BB8]" : "text-[#2F5FD0]"
        }`}
      >
        ログインする
      </Link>

      <Link
        href="/signup/user"
        onMouseEnter={() => setOpen(false)}
        className="rounded-lg bg-blue-600 px-6.5 py-3.5 text-base font-semibold text-white transition-colors hover:bg-blue-700"
      >
        予約する
      </Link>

      {/* self-stretchでヘッダー高と揃えているので、top-fullがヘッダー下端にちょうど重なる。 */}
      {open && (
        <div className="absolute right-0 top-full grid w-140 grid-cols-2 gap-2 rounded-b-2xl border border-t-0 border-[#ECEEF1] bg-white p-7.5 shadow-[0_12px_28px_rgba(31,35,40,.1)]">
          {AUDIENCE_LINKS.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-[10px] p-4 transition-colors hover:bg-[#F1F5FD]"
            >
              <span className="mb-1.75 block text-[17px] font-bold leading-normal text-[#1F2328]">
                {item.name}
              </span>
              <span className="block text-sm font-medium leading-loose text-gray-600">
                {item.description}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
