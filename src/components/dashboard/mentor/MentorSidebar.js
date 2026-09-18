"use client";

import Link from "next/link";
import { Calendar, CalendarDays, User, FileChartColumn } from "lucide-react";
import { IconBuildingBank } from "@tabler/icons-react";
import Icon from "../profile/icon";
import UnreadBadge from "../common/UnreadBadge";
import { totalUnread } from "@/lib/unreadMessages";

export const MENTOR_DEFAULT_SIDE = "appointment";

// href を持つ項目は独立ルート。持たない項目は /dashboard/mentor 内のタブ。
// 未実装のメッセージ/設定は MentorSidebar の履歴に残していた分をここに置く:
//   { key: "message", label: "メッセージ", Icon: MessageCircle },
//   { key: "setting", label: "設定", Icon: Settings },
export const MENTOR_NAV = [
  { key: "appointment", label: "予約管理", Icon: Calendar },
  {
    key: "availability",
    label: "面談可能日時",
    Icon: CalendarDays,
    href: "/dashboard/mentor/availability",
  },
  { key: "profile", label: "プロフィール", Icon: User },
  { key: "template", label: "テンプレート", Icon: FileChartColumn },
  { key: "payout", label: "支払い", Icon: IconBuildingBank },
];

// /dashboard/mentor 上でローカルstateとして切り替えられるタブのキー
export const MENTOR_TAB_KEYS = MENTOR_NAV.filter((item) => !item.href).map(
  (item) => item.key,
);

const tabHref = (key) =>
  key === MENTOR_DEFAULT_SIDE
    ? "/dashboard/mentor"
    : `/dashboard/mentor?side=${key}`;

// setSide を渡さない（=独立ルート側でサイドバーだけ表示する）場合、
// タブ項目もダッシュボード本体へのリンクとして描画する。
export default function MentorSidebar({ profile, side, setSide, unreadByMeeting = {} }) {
  // 未読は予約管理タブのカードから辿るので、合計は「予約管理」に出す
  const unreadCount = totalUnread(unreadByMeeting);

  const baseStyle = "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium";
  const activeStyle = "bg-blue-50 text-blue-600";
  const inactiveStyle = "text-gray-700 hover:bg-gray-50";

  return (
    <aside className="lg:col-span-1">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center mb-6 pb-6 border-b">
          <Icon size={100} url={profile?.icon} />
          <h3 className="font-bold text-lg">{profile?.name}</h3>
          {/* mentorは大学・学部を表示 */}
          <p className="text-sm pt-0.5 text-gray-600">{profile?.university}</p>
          <p className="text-sm pt-0.5 text-gray-600">{profile?.faculty}</p>
        </div>

        <nav className="space-y-2">
          {MENTOR_NAV.map(({ key, label, Icon: ItemIcon, href }) => {
            const className = `${baseStyle} ${side === key ? activeStyle : inactiveStyle}`;
            const body = (
              <>
                <ItemIcon size={20} />
                {label}
                {key === "appointment" && (
                  <UnreadBadge count={unreadCount} className="ml-auto" />
                )}
              </>
            );

            if (href || !setSide) {
              return (
                <Link key={key} href={href ?? tabHref(key)} className={className}>
                  {body}
                </Link>
              );
            }

            return (
              <button key={key} className={className} onClick={() => setSide(key)}>
                {body}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
