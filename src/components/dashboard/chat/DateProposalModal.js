"use client";

import { useState } from "react";
import { X, CalendarClock } from "lucide-react";
import DateChoiceFields from "@/components/dashboard/DateChoiceFields";
import { emptyChoices, selectedChoices } from "@/lib/schedule";

export default function DateProposalModal({
  onClose,
  onSubmit,
  availabilityByDate = {},
  bookedByDate = {},
  unrestricted = false,
}) {
  const [choices, setChoices] = useState(emptyChoices);
  const [submitting, setSubmitting] = useState(false);

  const selected = selectedChoices(choices);

  const handleSubmit = async () => {
    if (selected.length === 0) return;
    setSubmitting(true);
    const result = await onSubmit(selected);
    setSubmitting(false);
    // 送信できなかった場合（空きが埋まった等）はモーダルを開いたままにする
    if (result?.error) return;
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarClock size={20} className="text-blue-600" />
            <h2 className="font-bold text-lg">日時を提案する</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          各項目を押すとカレンダーが開きます。第1希望は必須です。
          第2・第3希望も送ると日程が決まりやすくなります。
        </p>

        <DateChoiceFields
          choices={choices}
          onChange={setChoices}
          availabilityByDate={availabilityByDate}
          bookedByDate={bookedByDate}
          unrestricted={unrestricted}
        />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={selected.length === 0 || submitting}
          className="mt-5 w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {submitting ? "送信中..." : `提案を送る（${selected.length}件）`}
        </button>
      </div>
    </div>
  );
}
