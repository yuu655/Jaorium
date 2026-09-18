import { formatUnreadBadge } from "@/lib/unreadMessages";

// 未読件数のバッジ。0件のときは何も描画しない。
export default function UnreadBadge({ count, className = "" }) {
  const label = formatUnreadBadge(count);
  if (!label) return null;

  return (
    <span
      aria-label={`未読${label}件`}
      className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold leading-none ${className}`}
    >
      {label}
    </span>
  );
}
