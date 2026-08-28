import Link from "next/link";
import Image from "next/image";
import HeaderNav from "./headerComponents/headerNav";
import MobileMenu from "@/components/headerComponents/mobileMenu";

export default function Header({ propClassName = "" }) {
  return (
    <header
      className={`sticky top-0 z-50 border-b border-[#ECEEF1] bg-white/92 backdrop-blur-md ${propClassName}`}
      style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
    >
      <nav className="mx-auto flex h-21.5 max-w-350 items-stretch justify-between px-4.5 lg:px-14">
        <Link href="/" className="flex items-center">
          <span className="relative block size-[70px]">
            <Image
              loading="eager"
              src="/logo.png"
              alt="ロゴ"
              fill
              className="object-contain"
            />
          </span>
        </Link>

        <HeaderNav />

        <div className="flex items-center gap-2.5 lg:hidden">
          <Link
            href="/signup/user"
            className="rounded-lg bg-blue-600 px-4 py-2.75 text-[15px] font-bold text-white transition-colors hover:bg-blue-700"
          >
            予約する
          </Link>
          <MobileMenu />
        </div>
      </nav>
    </header>
  );
}
