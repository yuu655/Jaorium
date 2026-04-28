"use client";
import { Button } from "./ui/button";
import Link from "next/link";
import Image from "next/image";
import HeaderNav from "./headerComponents/headerNav";
// import Humberger from "./headerComponents/humberger";
import Humberger from "@/components/headerComponents/drawerMenu";


export default function Header({ propClassName }) {
  const nav_list = [
    { name: "コンセプト", href: "/concept" },
    { name: "メンター紹介", href: "/mentors" },
    { name: "記事", href: "/articles" },
    { name: "メンター募集", href: "/recruitment" },
    // { name: "メンターになりたい方へ", href: "/forCompanies" },
  ];
  return (
    <header
      className={`h-17.5 flex items-center sticky top-0 z-50 justify-center ${propClassName}`}
    >
      <div className="w-full max-w-300 px-4">
        <nav className="flex p-4 justify-between items-center">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="ロゴ"
              width={70}
              height={70}
              className="object-contain"
            />
          </Link>

          <HeaderNav nav_list={nav_list} />
          <Humberger nav_list={nav_list} />
        </nav>
      </div>
    </header>
  );
}
