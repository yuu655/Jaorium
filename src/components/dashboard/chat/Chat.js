"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  CalendarClock,
  Send,
  RotateCcw,
  LogOut,
  X,
  Info,
} from "lucide-react";
import DateProposalModal from "./DateProposalModal";
import {
  confirmDate,
  resetDate,
  sendDateProposal,
  requestFinish,
  approveFinish,
  cancelFinishRequest,
} from "./actions";

// shadcn/ui
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const supabase = createClient();

export default function Chat({
  meeting: initialMeeting,
  meeting_schedule,
  currentUserId,
  counterpart,
  initialMessages,
  isMentor,
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [meeting, setMeeting] = useState(initialMeeting);
  const [meeting_sc, setMeeting_sc] = useState(meeting_schedule);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [confirmingId, setConfirmingId] = useState(null);
  const [resetting, setResetting] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showMeetingInfo, setShowMeetingInfo] = useState(false);
  // console.log(meeting_sc)

  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  const counterpartIconUrl = counterpart?.icon
    ? supabase.storage.from("avatars").getPublicUrl(counterpart.icon).data
        .publicUrl
    : "/default.jpg";

  // リアルタイム: メッセージ購読
  // useEffect(() => {
  //   const channel = supabase
  //     .channel(`chat:${meeting.id}`)
  //     .on(
  //       "postgres_changes",
  //       {
  //         event: "INSERT",
  //         schema: "public",
  //         table: "messages",
  //         filter: `meeting_id=eq.${meeting.id}`,
  //       },
  //       (payload) => {
  //         const newMsg = payload.new;
  //         setMessages((prev) => [...prev, newMsg]);
  //       },
  //     )
  //     .subscribe();

  //   return () => supabase.removeChannel(channel);
  // }, [meeting.id, currentUserId]);

  // // リアルタイム: meeting状態の変化を購読
  // useEffect(() => {
  //   const channel = supabase
  //     .channel(`meeting:${meeting.id}`)
  //     .on(
  //       "postgres_changes",
  //       {
  //         event: "UPDATE",
  //         schema: "public",
  //         table: "meetings",
  //         filter: `id=eq.${meeting.id}`,
  //       },
  //       (payload) => {
  //         const updated = payload.new;
  //         const prev = meeting;
  //         setMeeting(updated);
  //       },
  //     )
  //     .subscribe();

  //   return () => supabase.removeChannel(channel);
  // }, [meeting.id, currentUserId]);
  useEffect(() => {
    // 1つのチャンネルにまとめる
    const channel = supabase
      .channel(`room:${meeting.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `meeting_id=eq.${meeting.id}`,
        },
        (payload) => {
          // prevを使って最新の状態に対して追加しているので安全です
          setMessages((prev) => [...prev, payload.new]);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "meetings",
          filter: `id=eq.${meeting.id}`,
        },
        (payload) => {
          setMeeting(payload.new);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "meeting_schedules",
          filter: `meeting_id=eq.${meeting.id}`,
        },
        (payload) => {
          setMeeting_sc(payload.new);
        },
      )
      .subscribe();

    // クリーンアップ関数でチャンネルを破棄
    return () => {
      supabase.removeChannel(channel);
    };
  }, [meeting.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const content = input.trim();
    if (!content || sending) return;
    setSending(true);
    setInput("");
    const { error } = await supabase.from("messages").insert({
      meeting_id: meeting.id,
      sender_id: currentUserId,
      content,
    });
    if (error) setInput(content);
    setSending(false);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleDateProposal = async (date, time) => {
    await sendDateProposal(meeting.id, date, time);
  };

  const handleResetDate = async () => {
    setResetting(true);
    await resetDate(meeting.id);
    setResetting(false);
    setShowResetDialog(false);
  };

  const handleRequestFinish = async () => {
    setFinishing(true);
    await requestFinish(meeting.id);
    setFinishing(false);
    setShowFinishDialog(false);
  };

  const handleApproveFinish = async () => {
    setFinishing(true);
    await approveFinish(meeting.id);
    setFinishing(false);
  };

  const handleCancelFinishRequest = async () => {
    await cancelFinishRequest(meeting.id);
  };

  const parseProposal = (content) => {
    if (!content?.includes("|")) return { date: null, time: content ?? "" };
    const [date, time] = content.split("|");
    return { date, time };
  };

  const handleConfirmDate = async (msg) => {
    const { date, time } = parseProposal(msg.content);
    if (!date || !time) return;
    setConfirmingId(msg.id);
    await confirmDate(meeting.id, date, time);
    setConfirmingId(null);
  };

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

  const groupedMessages = messages.reduce((groups, msg) => {
    const date = new Date(msg.created_at).toDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  // 終了申請の状態
  const iRequested = meeting.finish_requested_by === currentUserId;
  const theyRequested =
    meeting.finish_requested_by &&
    meeting.finish_requested_by !== currentUserId;

  return (
    <div className="flex flex-col h-[calc(100vh-70px)]">
      {/* チャットヘッダー */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 shrink-0">
        <Link
          href={`/dashboard/${isMentor ? "mentor" : "user"}`}
          className="text-gray-500 hover:text-gray-700 transition-colors shrink-0"
        >
          <ArrowLeft size={20} />
        </Link>

        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Image
            src={counterpartIconUrl}
            alt={counterpart?.name ?? ""}
            width={40}
            height={40}
            className="rounded-full object-cover w-10 h-10 shrink-0"
            onError={(e) => {
              e.currentTarget.src = "/default.jpg";
            }}
          />
          <div className="min-w-0">
            <p className="font-bold text-sm truncate">{counterpart?.name}</p>
            <p className="text-xs text-gray-500 truncate">
              {counterpart?.university
                ? `${counterpart.university} ${counterpart.faculty ?? ""}`
                : `${counterpart?.grade ?? ""} ${counterpart?.desire ?? ""}`}
            </p>
          </div>
        </div>

        <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
          <p className="text-sm text-gray-700 font-medium">{meeting.title}</p>
          {meeting_sc.is_commit ? (
            <div className="flex items-center gap-1.5">
              <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                <CheckCircle size={12} />
                {formatProposalDate(meeting_sc.date)} {meeting_sc.time}
              </span>
              {/* 日時リセットボタン */}
              <button
                onClick={() => setShowResetDialog(true)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="日時をリセット"
              >
                <RotateCcw size={13} />
              </button>
            </div>
          ) : (
            <span className="text-xs text-gray-400">日時未定</span>
          )}
        </div>

        {/* ミーティング終了ボタン */}
        <button
          onClick={() => setShowFinishDialog(true)}
          disabled={!!meeting.finish_requested_by}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          title="ミーティングを終了する"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">終了</span>
        </button>

        <button
          onClick={() => setShowMeetingInfo(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shrink-0"
          title="ミーティング情報を見る"
        >
          <Info size={14} />
          <span className="hidden sm:inline">詳細</span>
        </button>
      </div>

      {/* 確定バナー */}
      {meeting_sc.is_commit && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-2 shrink-0">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <p className="text-sm text-green-700 font-medium flex items-center gap-1">
              <CheckCircle size={14} />
              {formatProposalDate(meeting_sc.date)} {meeting_sc.time} で確定
            </p>
            {/* モバイル用リセットボタン */}
            <button
              onClick={() => setShowResetDialog(true)}
              className="sm:hidden flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
            >
              <RotateCcw size={12} />
              日時を変更
            </button>
          </div>
        </div>
      )}

      {/* 終了申請バナー */}
      {theyRequested && (
        <div className="bg-orange-50 border-b border-orange-200 px-4 py-2 shrink-0">
          <div className="flex items-center justify-between gap-3 max-w-4xl mx-auto">
            <p className="text-sm text-orange-700 font-medium">
              {counterpart?.name} がミーティングの終了を申請しました
            </p>
            <button
              onClick={handleApproveFinish}
              disabled={finishing}
              className="px-3 py-1 bg-orange-600 text-white text-xs font-medium rounded-lg hover:bg-orange-700 transition-colors disabled:bg-gray-300 shrink-0"
            >
              {finishing ? "処理中..." : "承認して終了"}
            </button>
          </div>
        </div>
      )}

      {iRequested && (
        <div className="bg-gray-50 border-b px-4 py-2 shrink-0">
          <div className="flex items-center justify-between gap-3 max-w-4xl mx-auto">
            <p className="text-sm text-gray-600">
              終了申請中... 相手の承認を待っています
            </p>
            <button
              onClick={handleCancelFinishRequest}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={12} />
              申請を取り消す
            </button>
          </div>
        </div>
      )}

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
                const isMine = msg.sender_id === currentUserId;
                const isDateProposal = msg.type === "date_proposal";
                const canConfirm =
                  isDateProposal && !isMine && !meeting_sc.is_commit;

                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    {!isMine && (
                      <Image
                        src={counterpartIconUrl}
                        alt=""
                        width={28}
                        height={28}
                        className="rounded-full object-cover w-7 h-7 shrink-0 mb-1"
                        onError={(e) => {
                          e.currentTarget.src = "/default.jpg";
                        }}
                      />
                    )}

                    <div
                      className={`flex flex-col gap-1 max-w-[70%] ${isMine ? "items-end" : "items-start"}`}
                    >
                      {isDateProposal ? (
                        <div
                          className={`px-4 py-3 rounded-2xl border-2 text-sm min-w-[180px] ${
                            isMine
                              ? "bg-blue-50 border-blue-300 rounded-br-sm"
                              : "bg-white border-blue-300 rounded-bl-sm"
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
                                {isMine && (
                                  <p className="font-bold text-base">相手からの承認をお待ちください</p>
                                )}

                                {canConfirm && (
                                  <button
                                    onClick={() => handleConfirmDate(msg)}
                                    disabled={confirmingId === msg.id}
                                    className="mt-3 w-full py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300"
                                  >
                                    {confirmingId === msg.id
                                      ? "確定中..."
                                      : "この日時で確定する"}
                                  </button>
                                )}

                                {meeting_sc.is_commit &&
                                  meeting_sc.date === pDate &&
                                  meeting_sc.time === pTime && (
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
                            isMine
                              ? "bg-blue-600 text-white rounded-br-sm"
                              : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm"
                          }`}
                        >
                          {msg.content}
                        </div>
                      )}
                      <span className="text-xs text-gray-400">
                        {formatTime(msg.created_at)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {messages.length === 0 && (
          <div className="text-center py-20 text-gray-400 text-sm">
            まだメッセージがありません。
            <br />
            日時の提案から始めてみましょう。
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 入力欄 */}
      <div className="bg-white border-t px-4 py-3 shrink-0">
        <div className="flex items-end gap-2 max-w-4xl mx-auto">
          <div className="relative group">
            {!meeting_sc.is_commit && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-800 text-white text-xl rounded-lg whitespace-nowrap pointer-events-none opacity-100">
                日時を提案しましょう
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
              </div>
            )}
            <button
              onClick={() => setShowDateModal(true)}
              disabled={meeting_sc.is_commit}
              className="w-11 h-11 border border-gray-300 text-gray-500 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              title={
                meeting_sc.is_commit
                  ? "日時確定済み（リセットで再提案可能）"
                  : "日時を提案する"
              }
            >
              <CalendarClock size={18} />
            </button>
          </div>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="メッセージを入力...（Enterで送信）"
            rows={1}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none max-h-32 overflow-y-auto"
            style={{ minHeight: "44px" }}
          />

          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="w-11 h-11 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed shrink-0"
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* 日時提案モーダル */}
      {showDateModal && (
        <DateProposalModal
          onClose={() => setShowDateModal(false)}
          onSubmit={handleDateProposal}
        />
      )}

      {/* 日時リセット確認ダイアログ */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>日時をリセットしますか？</AlertDialogTitle>
            <AlertDialogDescription>
              確定した日時（{formatProposalDate(meeting_sc.date)} {meeting_sc.time}
              ）をリセットします。 再度日時の提案が必要になります。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetDate}
              className="bg-gray-700 hover:bg-gray-800"
            >
              {resetting ? "リセット中..." : "リセットする"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ミーティング終了確認ダイアログ */}
      <AlertDialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ミーティングの終了を申請しますか？
            </AlertDialogTitle>
            <AlertDialogDescription>
              相手が承認するとミーティングが終了し、過去の相談に移動します。
              相手が承認するまでチャットは続けられます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRequestFinish}
              className="bg-red-600 hover:bg-red-700"
            >
              {finishing ? "申請中..." : "終了を申請する"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {showMeetingInfo && (
        <>
          {/* オーバーレイ */}
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setShowMeetingInfo(false)}
          />
          {/* ドロワー */}
          <div className="fixed right-0 top-0 h-full w-80 max-w-full bg-white shadow-xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                <Info size={15} className="text-blue-500" />
                ミーティング情報
              </h2>
              <button
                onClick={() => setShowMeetingInfo(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {/* タイトル */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  タイトル
                </p>
                <p className="text-sm text-gray-800 font-medium leading-relaxed">
                  {meeting.title || "未設定"}
                </p>
              </div>

              {/* 説明 */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  内容・説明
                </p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {meeting.description || "説明はありません"}
                </p>
              </div>

              {/* 日時 */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  日時
                </p>
                {meeting_sc.is_commit ? (
                  <p className="text-sm text-green-600 font-medium flex items-center gap-1">
                    <CheckCircle size={13} />
                    {formatProposalDate(meeting_sc.date)} {meeting_sc.time}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400">未定</p>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  最近、進路や受験勉強のことで一番「困った」「悩んだ」具体的なエピソード
                </p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {meeting.trouble_episode || "説明はありません"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  その悩みや疑問を解決するために、これまでに試したこと
                </p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {meeting.actions_taken || "説明はありません"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  上記の行動をとってみて、「解決しなかったこと」や「まだ足りない」と感じたこと
                </p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {meeting.unresolved_issues || "説明はありません"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  今回のオンライン面談（約40分）が終わった時、一番得たい情報
                </p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {meeting.desired_outcome || "説明はありません"}
                </p>
              </div>

              <div>
                <Link href={`/dashboard/Interview/${meeting.id}`} className="text-blue-500 hover:text-blue-700 transition-colors">
                  ミーティングに飛ぶ
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
