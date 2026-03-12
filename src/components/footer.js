import Link from "next/link";
import { Mail, X, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Footer() {
  return (
    <footer className="bg-[#3f3f3f] text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6.75 h-6.75 rounded-full bg-white" />
              <span className="text-[20px] font-bold">JaoRium</span>
            </div>
            <p className="text-sm text-gray-300">
              情報戦に、終止符を。
            </p>
          </div>

          {/* Navigation Links */}
          <div className="col-span-1">
            <h3 className="font-bold mb-4">サービス</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/concept" className="text-sm text-gray-300 hover:text-white transition-colors">
                  コンセプト
                </Link>
              </li>
              <li>
                <Link href="/mentors" className="text-sm text-gray-300 hover:text-white transition-colors">
                  メンター紹介
                </Link>
              </li>
              <li>
                <Link href="/signup" className="text-sm text-gray-300 hover:text-blue-400 transition-colors">
                  予約する
                </Link>
              </li>
            </ul>
          </div>

          {/* Information */}
          <div className="col-span-1">
            <h3 className="font-bold mb-4">情報</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/articles" className="text-sm text-gray-300 hover:text-white transition-colors">
                  記事・お知らせ
                </Link>
              </li>
              <li>
                <Link href="/forCompanies" className="text-sm text-gray-300 hover:text-white transition-colors">
                  企業の方へ
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-1">
            <h3 className="font-bold mb-4">お問い合わせ</h3>
            <div className="flex gap-4">
              <a
                href="mailto:contact@jaorium.example"
                className="text-gray-300 hover:text-white transition-colors"
                aria-label="Email"
              >
                <Mail size={20} />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <X size={20} />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-600 pt-8 text-center">
          <p className="text-sm text-gray-400">
            © 2026 JaoRium. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
