"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Check, ChevronRight, X } from "lucide-react";
import DateTimeCalendar from "./DateTimeCalendar";
import { formatProposalDate, proposalLabel, selectedChoices } from "@/lib/schedule";

// 「第N希望」ボタンを押すとカレンダーのダイアログが開く入力欄。
// 予約フォーム（画面に直接埋め込む）とチャットの日時提案モーダルの両方で使う。
// choices の状態は呼び出し側が持つ（フォーム送信や送信ボタンと束ねるため）。
// name を渡すと、その名前の hidden input にカンマ区切りで値を書き出す
// （予約フォームのServer Action用。チャット側はJSで送るので渡さない）。
export default function DateChoiceFields({
  choices,
  onChange,
  availabilityByDate = {},
  bookedByDate = {},
  unrestricted = false,
  name,
}) {
  // 編集中の希望の番号。null ならダイアログを閉じている
  const [editingIndex, setEditingIndex] = useState(null);
  // ダイアログの中だけの下書き。キャンセルすれば元に戻る
  const [draft, setDraft] = useState(null);

  const isOpen = editingIndex !== null;

  // 他の希望で既に押さえている枠（同じ日時は2回選べない）
  const takenByOther = useMemo(
    () =>
      new Set(
        choices
          .map((choice, i) =>
            choice?.date && choice?.time && i !== editingIndex
              ? `${choice.date}|${choice.time}`
              : null,
          )
          .filter(Boolean),
      ),
    [choices, editingIndex],
  );

  const closeDialog = () => {
    setEditingIndex(null);
    setDraft(null);
  };

  // ダイアログを開いている間は Esc で閉じ、背面がスクロールしないようにする
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") closeDialog();
    };
    document.addEventListener("keydown", onKeyDown);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
    };
  }, [isOpen]);

  const openDialog = (index) => {
    setEditingIndex(index);
    setDraft(choices[index] ?? null);
  };

  const updateChoice = (index, value) =>
    onChange(choices.map((choice, i) => (i === index ? value : choice)));

  const confirmDraft = () => {
    if (!draft?.date || !draft?.time) return;
    updateChoice(editingIndex, draft);
    closeDialog();
  };

  const clearChoice = (index) => {
    updateChoice(index, null);
    if (index === editingIndex) closeDialog();
  };

  const selected = selectedChoices(choices);

  return (
    <div>
      <div className="space-y-2">
        {choices.map((choice, index) => {
          const filled = Boolean(choice?.date && choice?.time);
          const optional = index > 0;

          return (
            <div
              key={index}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
                filled ? "border-blue-300 bg-blue-50/50" : "border-gray-300 bg-white"
              }`}
            >
              <button
                type="button"
                onClick={() => openDialog(index)}
                className="flex flex-1 items-center gap-3 text-left"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    filled ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {filled ? <Check size={16} /> : index + 1}
                </span>

                <span className="flex-1">
                  <span className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
                    {proposalLabel(index)}
                    {optional && !filled && (
                      <span className="text-xs font-normal text-gray-400">(任意)</span>
                    )}
                    {index === 0 && <span className="text-red-500">*</span>}
                  </span>
                  <span className="mt-0.5 block text-sm text-gray-600">
                    {filled ? (
                      `${formatProposalDate(choice.date)} ${choice.time}`
                    ) : (
                      <span className="text-gray-400">タップして日時を選択</span>
                    )}
                  </span>
                </span>

                <ChevronRight size={18} className="shrink-0 text-gray-400" />
              </button>

              {filled && (
                <button
                  type="button"
                  onClick={() => clearChoice(index)}
                  aria-label={`${proposalLabel(index)}を削除`}
                  className="shrink-0 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Server Action へはカンマ区切りの1文字列で渡す */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={selected.map(({ date, time }) => `${date}|${time}`).join(",")}
        />
      )}

      {/* 日時選択ダイアログ */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4"
          onClick={closeDialog}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${proposalLabel(editingIndex)}の日時を選択`}
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarClock size={20} className="text-blue-600" />
                <h2 className="text-lg font-bold">
                  {proposalLabel(editingIndex)}の日時
                </h2>
              </div>
              <button
                type="button"
                onClick={closeDialog}
                aria-label="閉じる"
                className="text-gray-400 transition-colors hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <DateTimeCalendar
              value={draft}
              onChange={setDraft}
              availabilityByDate={availabilityByDate}
              bookedByDate={bookedByDate}
              unrestricted={unrestricted}
              disabledSlotKeys={takenByOther}
            />

            <div className="mt-5 flex gap-3">
              {choices[editingIndex] && (
                <button
                  type="button"
                  onClick={() => clearChoice(editingIndex)}
                  className="rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                >
                  削除
                </button>
              )}
              <button
                type="button"
                onClick={confirmDraft}
                disabled={!draft?.date || !draft?.time}
                className="flex-1 rounded-lg bg-blue-600 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {draft?.date && draft?.time
                  ? `${formatProposalDate(draft.date)} ${draft.time} にする`
                  : "日時を選択してください"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
