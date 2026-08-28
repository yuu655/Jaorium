"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ChevronRight, X } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AUDIENCE_LINKS, NAV_LINKS } from "./navLinks";

// 開閉ボタンはデザインどおり40x40の枠付き。
const iconButtonClass =
  "flex size-10 shrink-0 items-center justify-center rounded-lg border border-[#E4E7EB] transition-colors hover:border-blue-600";

function MenuRow({ href, children, className = "" }) {
  return (
    <SheetClose asChild>
      <Link
        href={href}
        className={`flex items-center justify-between border-b border-[#F1F2F4] px-5.5 py-5 transition-colors hover:bg-[#F9FAFC] ${className}`}
      >
        {children}
        <ChevronRight className="size-5 shrink-0 text-[#98A0AA]" />
      </Link>
    </SheetClose>
  );
}

export default function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button type="button" className={iconButtonClass} aria-label="メニューを開く">
          <span className="flex flex-col gap-1.25">
            <span className="block h-px w-4.5 bg-[#1F2328]" />
            <span className="block h-px w-4.5 bg-[#1F2328]" />
            <span className="block h-px w-4.5 bg-[#1F2328]" />
          </span>
        </button>
      </SheetTrigger>

      <SheetContent
        side="top"
        showCloseButton={false}
        className="h-dvh max-w-none gap-0 overflow-y-auto p-0"
        style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
      >
        <SheetTitle className="sr-only">メニュー</SheetTitle>
        <SheetDescription className="sr-only">
          JaoRiumのページ一覧
        </SheetDescription>

        <div className="flex items-center justify-between border-b border-[#ECEEF1] px-4.5 py-2">
          <SheetClose asChild>
            <Link href="/" className="flex items-center">
              <span className="relative block size-[70px]">
                <Image
                  src="/logo.png"
                  alt="ロゴ"
                  fill
                  className="object-contain"
                />
              </span>
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <button type="button" className={iconButtonClass} aria-label="メニューを閉じる">
              <X className="size-5 text-[#1F2328]" />
            </button>
          </SheetClose>
        </div>

        <div className="pt-2">
          {NAV_LINKS.map((item) => (
            <MenuRow key={item.name} href={item.href}>
              <span className="text-[19px] font-bold leading-none text-[#1F2328]">
                {item.name}
              </span>
            </MenuRow>
          ))}

          <div className="border-b border-[#E4E7EB] bg-[#F1F5FD] px-5.5 pb-5.5 pt-5">
            <p className="mb-4 text-[11px] font-semibold tracking-[0.12em] text-blue-600">
              FOR YOU
            </p>
            <div className="flex flex-col gap-4">
              {AUDIENCE_LINKS.map((item) => (
                <SheetClose asChild key={item.name}>
                  <Link
                    href={item.href}
                    className="flex items-center justify-between"
                  >
                    <span className="text-base font-semibold leading-none text-[#1F2328]">
                      {item.name}
                    </span>
                    <ChevronRight className="size-4.5 shrink-0 text-[#8C9BB8]" />
                  </Link>
                </SheetClose>
              ))}
            </div>
          </div>

          <MenuRow href="/contact">
            <span className="text-[17px] font-semibold leading-none text-gray-600">
              お問い合わせ
            </span>
          </MenuRow>
        </div>

        <div className="flex flex-col gap-3 px-5.5 pb-8 pt-6">
          <SheetClose asChild>
            <Link
              href="/signup/user"
              className="rounded-lg bg-blue-600 py-4.5 text-center text-lg font-semibold text-white transition-colors hover:bg-blue-700"
            >
              予約する
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              href="/login"
              className="rounded-lg border-[1.5px] border-[#D5D9DF] py-4 text-center text-[17px] font-bold text-[#1F2328] transition-colors hover:border-blue-600 hover:text-blue-600"
            >
              ログインする
            </Link>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
