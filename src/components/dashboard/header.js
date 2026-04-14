"use client";
import Link from "next/link";
import { LogOut, Bell } from "lucide-react";

export default function Header() {
  return (
    <div className="bg-white border-b sticky">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/dashboard" className="p-4 cursor">
            <h1 className="text-2xl md:text-3xl font-bold">マイページ</h1></Link>
            <p className="text-gray-600 mt-1">受験生ダッシュボード</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Bell size={24} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <form action="/api/auth/signout" method="POST">
              <button className="relative p-2 text-md hover:bg-gray-100 rounded-full transition-colors" type="submit">ログアウト</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
