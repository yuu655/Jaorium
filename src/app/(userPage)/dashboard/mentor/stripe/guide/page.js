"use client";
 
import { useState } from "react";
import {
  ClipboardList,
  AlertCircle,
  Copy,
  Check,
  ArrowRight,
  FileText,
  CreditCard,
  User,
} from "lucide-react";
import { createStripeOnboarding } from "@/components/dashboard/mentor/actions";
 
const TEMPLATES = [
  {
    label: "業種・事業内容",
    value: "大学受験・進路に関するオンライン面談サービス",
  },
  {
    label: "ウェブサイト",
    value: "https://www.jaorium.com",
  },
  {
    label: "事業形態",
    value: "個人（個人事業主）",
  },
];
 
const STEPS = [
  {
    icon: <User size={14} />,
    title: "本人確認書類を準備する",
    desc: "運転免許証またはマイナンバーカードをお手元にご用意ください。マイナンバーの入力も必要です。",
  },
  {
    icon: <FileText size={14} />,
    title: "事業情報を入力する",
    desc: "事業形態は「個人」を選択してください。事業内容の入力欄には、下記のテンプレートをそのままコピーして使えます。",
  },
  {
    icon: <CreditCard size={14} />,
    title: "銀行口座を登録する",
    desc: "報酬の振込先となる銀行口座（金融機関名・支店・口座番号）を入力してください。",
  },
];
 
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
 
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
 
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors shrink-0"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "コピー済み" : "コピー"}
    </button>
  );
}
 
export default function StripeGuidePage() {
  const [loading, setLoading] = useState(false);
 
  const handleStart = async () => {
    setLoading(true);
    await createStripeOnboarding();
    setLoading(false);
  };
 
  return (
    <div className="max-w-lg mx-auto px-4 py-10">
 
      {/* ヘッダー */}
      <div className="mb-8">
        <h1 className="text-lg font-bold text-gray-800 mb-2">振込口座の登録</h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          面談報酬を受け取るために、Stripeで口座情報を登録してください。登録はStripeの安全なページで行われます。
        </p>
      </div>
 
      {/* ステップ */}
      <div className="flex flex-col gap-3 mb-8">
        {STEPS.map((step, i) => (
          <div
            key={i}
            className="flex gap-3 items-start bg-white border border-gray-200 rounded-xl px-4 py-3.5"
          >
            <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0 mt-0.5 text-xs font-medium">
              {i + 1}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800 mb-0.5">{step.title}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
 
      {/* テンプレート */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-8">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1.5 mb-3">
          <ClipboardList size={13} />
          入力テンプレート（コピーして使用）
        </p>
        <div className="flex flex-col gap-2.5">
          {TEMPLATES.map((t, i) => (
            <div key={i}>
              <p className="text-xs text-gray-400 mb-1">{t.label}</p>
              <div className="flex items-center justify-between gap-3 bg-white border border-gray-200 rounded-lg px-3 py-2">
                <span className="text-sm text-gray-700 truncate">{t.value}</span>
                <CopyButton text={t.value} />
              </div>
            </div>
          ))}
        </div>
      </div>
 
      {/* 注意書き */}
      <div className="flex gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-8">
        <AlertCircle size={15} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 leading-relaxed">
          登録にはマイナンバーの提出が必要です。これはStripeの法的要件であり、当サービスが管理するものではありません。情報はStripeの安全なサーバーで管理されます。
        </p>
      </div>
 
      {/* ボタン */}
      <button
        onClick={handleStart}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm font-medium rounded-xl py-3 transition-colors"
      >
        <ArrowRight size={15} />
        {loading ? "リダイレクト中..." : "Stripeで口座登録を始める"}
      </button>
    </div>
  );
}