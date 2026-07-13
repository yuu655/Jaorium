"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle,
  Eye,
} from "lucide-react";

// profile/icon.js は mx-auto mb-3 付きでチャット行内では位置がずれるため、
// Chat.js と同じ素のImageでアバターを描画する
function Avatar({ size, url, className = "" }) {
  const src = url
    ? `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${url}`
    : "/default.jpg";
  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      className={`rounded-full object-cover shrink-0 ${className}`}
      style={{ width: size, height: size }}
      onError={(e) => {
        e.currentTarget.src = "/default.jpg";
      }}
    />
  );
}

// admin用のDM閲覧ビュー。メッセージの送信・日程操作はできない読み取り専用。
export default function AdminChatViewer({
  meeting,
  meetingSchedule,
  user,
  mentor,
  messages,
}) {
  const formatTime = (dateStr) =>
    new Date(dateStr).toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("ja-JP", {
      month: "long",
      day: "numeric",
    });

  const formatProposalDate = (dateStr) => {
    if (!dateStr?.includes("-")) return dateStr ?? "";
    const [year, month, day] = dateStr.split("-");
    return `${year}年${parseInt(month)}月${parseInt(day)}日`;
  };

  const parseProposal = (content) => {
    if (!content?.includes("|")) return { date: null, time: content ?? "" };
    const [date, time] = content.split("|");
    return { date, time };
  };

  const groupedMessages = messages.reduce((groups, msg) => {
    const date = new Date(msg.created_at).toDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  const senderOf = (msg) =>
    msg.sender_id === mentor?.id ? mentor : user;

  return (
    <div className="flex flex-col h-[calc(100vh-70px)]">
      {/* ヘッダー */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 shrink-0">
        <Link
          href="/dashboard/admin"
          className="text-gray-500 hover:text-gray-700 transition-colors shrink-0"
        >
          <ArrowLeft size={20} />
        </Link>

        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar size={36} url={mentor?.icon} />
            <div className="min-w-0">
              <p className="font-bold text-sm truncate">{mentor?.name}</p>
              <p className="text-xs text-gray-500 truncate">
                {mentor?.university} {mentor?.faculty ?? ""}
              </p>
            </div>
          </div>
          <span className="text-gray-300 shrink-0">×</span>
          <div className="flex items-center gap-2 min-w-0">
            <Avatar size={36} url={user?.icon} />
            <div className="min-w-0">
              <p className="font-bold text-sm truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">
                {user?.grade ?? ""} {user?.desire ?? ""}
              </p>
            </div>
          </div>
        </div>

        <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
          <p className="text-sm text-gray-700 font-medium">{meeting.title}</p>
          {meetingSchedule?.is_commit ? (
            <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
              <CheckCircle size={12} />
              {formatProposalDate(meetingSchedule.date)} {meetingSchedule.time}
            </span>
          ) : (
            <span className="text-xs text-gray-400">日時未定</span>
          )}
        </div>
      </div>

      {/* 閲覧専用バナー */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 shrink-0">
        <p className="text-xs text-amber-700 font-medium flex items-center gap-1.5 max-w-4xl mx-auto">
          <Eye size={13} />
          管理者閲覧モード — このDMは閲覧専用です
        </p>
      </div>

      {/* メッセージ一覧 */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 bg-gray-50">
        {Object.entries(groupedMessages).map(([date, msgs]) => (
          <div key={date}>
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 shrink-0">
                {formatDate(msgs[0].created_at)}
              </span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <div className="space-y-3">
              {msgs.map((msg) => {
                const isMentor = msg.sender_id === mentor?.id;
                const sender = senderOf(msg);
                const isDateProposal = msg.type === "date_proposal";

                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 ${isMentor ? "justify-start" : "justify-end"}`}
                  >
                    {isMentor && (
                      <Avatar size={28} url={sender?.icon} className="mb-1" />
                    )}

                    <div
                      className={`flex flex-col gap-1 max-w-[70%] ${isMentor ? "items-start" : "items-end"}`}
                    >
                      <span className="text-xs text-gray-500 font-medium">
                        {sender?.name}
                      </span>
                      {isDateProposal ? (
                        <div
                          className={`px-4 py-3 rounded-2xl border-2 border-blue-300 bg-white text-sm min-w-[180px] ${
                            isMentor ? "rounded-bl-sm" : "rounded-br-sm"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 text-blue-600 font-medium mb-2 text-xs">
                            <CalendarClock size={13} />
                            日時の提案
                          </div>
                          {(() => {
                            const { date: pDate, time: pTime } = parseProposal(
                              msg.content,
                            );
                            return (
                              <>
                                <p className="text-gray-800 font-bold text-base">
                                  {formatProposalDate(pDate)}
                                </p>
                                <p className="text-gray-600 text-sm">{pTime}</p>
                                {meetingSchedule?.is_commit &&
                                  meetingSchedule.date === pDate &&
                                  meetingSchedule.time === pTime && (
                                    <div className="mt-2 flex items-center gap-1 text-green-600 text-xs font-medium">
                                      <CheckCircle size={12} />
                                      確定済み
                                    </div>
                                  )}
                              </>
                            );
                          })()}
                        </div>
                      ) : (
                        <div
                          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                            isMentor
                              ? "bg-white text-gray-800 border border-gray-200 rounded-bl-sm"
                              : "bg-blue-600 text-white rounded-br-sm"
                          }`}
                        >
                          {msg.content}
                        </div>
                      )}
                      <span className="text-xs text-gray-400">
                        {formatTime(msg.created_at)}
                      </span>
                    </div>

                    {!isMentor && (
                      <Avatar size={28} url={sender?.icon} className="mb-1" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {messages.length === 0 && (
          <div className="text-center py-20 text-gray-400 text-sm">
            このミーティングにはまだメッセージがありません。
          </div>
        )}
      </div>
    </div>
  );
}
