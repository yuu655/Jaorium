"use client";
import Link from "next/link";
import { Calendar, MessageCircle, User, Settings } from "lucide-react";

import Icon from "./profile/icon";

export default function Sidebar({ profile, meetings, isMentor, side, setSide }) {
  const baseStyle =
    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium";
  const activeStyle = "bg-blue-50 text-blue-600";
  const inactiveStyle = "text-gray-700 hover:bg-gray-50";
  return (
    <aside className="lg:col-span-1">
      <div className="bg-white rounded-lg shadow-sm p-6">
        {/* Profile */}
        <div className="text-center mb-6 pb-6 border-b">
          {/* <div className="w-20 h-20 bg-linear-to-br from-blue-400 to-indigo-500 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-2xl font-bold">
            山
          </div> */}
          <Icon size={100} url={profile.icon}/>
          <h3 className="font-bold text-lg">{profile.name}</h3>
          {isMentor && (
            <div>
              <p className="text-sm pt-0.5 text-gray-600">
                {profile.university}
              </p>
              <p className="text-sm pt-0.5 text-gray-600">{profile.faculty}</p>
            </div>
          )}

          {/* <p className="text-sm pt-0.5 text-gray-600">{ profile.description }</p> */}
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          <button
            className={`${baseStyle} ${side === "appointment" ? activeStyle : inactiveStyle}`}
            onClick={() => setSide("appointment")}
          >
            <Calendar size={20} />
            予約管理
          </button>

          <button
            className={`${baseStyle} ${side === "message" ? activeStyle : inactiveStyle}`}
            onClick={() => setSide("message")}
          >
            <MessageCircle size={20} />
            メッセージ
          </button>

          <button
            className={`${baseStyle} ${side === "profile" ? activeStyle : inactiveStyle}`}
            onClick={() => setSide("profile")}
          >
            <User size={20} />
            プロフィール
          </button>

          <button
            className={`${baseStyle} ${side === "setting" ? activeStyle : inactiveStyle}`}
            onClick={() => setSide("setting")}
          >
            <Settings size={20} />
            設定
          </button>
        </nav>
      </div>

      {/* Quick Actions */}
      {/* {!isMentor && (
        <div className="bg-linear-to-br from-blue-600 to-indigo-600 rounded-lg shadow-sm p-6 mt-6 text-white">
          <h3 className="font-bold mb-2">メンターを探す</h3>
          <p className="text-sm text-blue-100 mb-4">
            新しいメンターに相談しませんか？
          </p>
          <Link
            href="/booking"
            className="block w-full px-4 py-2 bg-white text-blue-600 text-center font-medium rounded-lg hover:bg-gray-100 transition-colors"
          >
            相談を予約
          </Link>
        </div>
      )} */}
    </aside>
  );
}
