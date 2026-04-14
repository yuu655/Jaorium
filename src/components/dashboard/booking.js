"use client";
import { useActionState } from "react";

const consultationTypes = [
  "受験勉強全般",
  "志望校選び",
  "学部選択",
  "勉強方法",
  "モチベーション",
  "地方からの受験",
  "その他",
];

const questions = [
  {
    name: "trouble_episode",
    label: "最近、進路や受験勉強のことで一番「困った」「悩んだ」具体的なエピソードを教えてください",
    placeholder: "例：模試で志望校がE判定が続いており、どう対策すればいいかわからなくなっています。",
  },
  {
    name: "actions_taken",
    label: "その悩みや疑問を解決するために、直近で具体的にどのような行動をとりましたか？",
    placeholder: "例：塾の先生に相談したり、YouTubeで勉強法の動画を探して見てみました。",
  },
  {
    name: "unresolved_issues",
    label: "上記の行動をとってみて、「解決しなかったこと」や「まだ足りない」と感じたことはありましたか？",
    placeholder: "例：一般的なアドバイスはもらえたけど、自分の状況に合った具体的な方法がわからないままです。",
  },
  {
    name: "desired_outcome",
    label: "今回のオンライン面談（約40分）が終わった時、どういう情報を一番得たいですか？",
    placeholder: "例：今の自分のレベルから東大合格に向けて、具体的に何をすべきか道筋を知りたいです。",
  },
];

export default function Booking({ func }) {
  const [state, action, isPending] = useActionState(func, null);

  return (
    <form action={action} className="space-y-8">
      {state?.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{state.error}</p>
        </div>
      )}

      <div className="p-6 space-y-6">
        {/* 相談内容 */}
        <div>
          <label htmlFor="title" className="flex items-center gap-2 text-lg font-bold mb-2">
            相談内容 <span className="text-red-500">*</span>
          </label>
          <select
            id="title"
            name="title"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            required
          >
            <option value="">選択してください</option>
            {consultationTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* 詳細 */}
        <div>
          <label htmlFor="description" className="block text-lg font-bold mb-2">
            詳細
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            placeholder="例：地方の公立高校に通っていて、東大を目指しています。どのように情報収集すればいいか相談したいです。"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none"
          />
        </div>

        {/* 事前アンケート */}
        <div className="border-t pt-6 space-y-6">
          <p className="text-lg font-bold">事前アンケート</p>
          {questions.map((q, i) => (
            <div key={q.name}>
              <label htmlFor={q.name} className="block font-semibold mb-2 text-gray-800">
                Q{i + 1}. {q.label}
              </label>
              <textarea
                id={q.name}
                name={q.name}
                rows={3}
                placeholder={q.placeholder}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 送信ボタン */}
      <div className="px-6">
        <button
          type="submit"
          disabled={isPending}
          className="w-full px-8 py-4 bg-blue-600 text-white text-lg font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isPending ? "送信中..." : "登録する"}
        </button>
      </div>
    </form>
  );
}