"use client";

import { Calendar, MessageCircle, User, Settings } from "lucide-react";
import Icon from "../profile/icon";

export default function UserSidebar({ profile, side, setSide }) {
  const baseStyle = "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium";
  const activeStyle = "bg-blue-50 text-blue-600";
  const inactiveStyle = "text-gray-700 hover:bg-gray-50";

  return (
    <aside className="lg:col-span-1">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center mb-6 pb-6 border-b">
          <Icon size={100} url={profile.icon} />
          <h3 className="font-bold text-lg">{profile.name}</h3>
          <p className="text-sm pt-0.5 text-gray-600">{profile.grade}</p>
        </div>

        <nav className="space-y-2">
          <button className={`${baseStyle} ${side === "appointment" ? activeStyle : inactiveStyle}`} onClick={() => setSide("appointment")}>
            <Calendar size={20} />予約管理
          </button>
          {/* <button className={`${baseStyle} ${side === "message" ? activeStyle : inactiveStyle}`} onClick={() => setSide("message")}>
            <MessageCircle size={20} />メッセージ
          </button> */}
          <button className={`${baseStyle} ${side === "profile" ? activeStyle : inactiveStyle}`} onClick={() => setSide("profile")}>
            <User size={20} />プロフィール
          </button>
          {/* <button className={`${baseStyle} ${side === "setting" ? activeStyle : inactiveStyle}`} onClick={() => setSide("setting")}>
            <Settings size={20} />設定
          </button> */}
        </nav>
      </div>
    </aside>
  );
}
