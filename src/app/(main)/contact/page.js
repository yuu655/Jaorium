"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { AlertCircle, AlertTriangle, Check, HelpCircle, Info } from "lucide-react";
import { sendContactEmail } from "./actions";

const initialState = {};

// エラー件数サマリーの集計対象。actions.jsのフィールド名と揃える。
const FIELD_KEYS = ["name", "email", "email_re", "message"];

const EMPTY_VALUES = { name: "", email: "", email_re: "", message: "" };

const fontFamily = "'Noto Sans JP', sans-serif";

const inputClass = (hasError) =>
  [
    "w-full rounded-[10px] border bg-white px-4 py-4 text-base lg:text-[17px] text-[#1F2328]",
    "outline-none transition placeholder:text-[#98A0AA]",
    "focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/12",
    hasError ? "border-red-500" : "border-[#D5D9DF]",
  ].join(" ");

function RequiredBadge() {
  return (
    <span className="shrink-0 rounded bg-[#E8F1FE] px-1.75 py-1 text-[11px] font-medium leading-none text-blue-600">
      必須
    </span>
  );
}

function FieldError({ message }) {
  if (!message) return null;

  return (
    <p className="flex items-center gap-1.75 text-sm font-bold leading-relaxed text-red-600">
      <AlertTriangle className="size-4 shrink-0" />
      {message}
    </p>
  );
}

// モバイルは縦積み、lg以上は190pxのラベル列を持つ2カラムに切り替える。
function Field({ label, htmlFor, error, help, children }) {
  return (
    <div className="flex flex-col gap-2.5 lg:grid lg:grid-cols-[190px_1fr] lg:gap-7">
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-2 lg:pt-4.25 lg:items-start"
      >
        <span className="text-base font-medium leading-relaxed text-[#1F2328] lg:text-[17px]">
          {label}
        </span>
        <RequiredBadge />
      </label>
      <div className="flex flex-col gap-2.5">
        {children}
        {help && (
          <p className="text-sm leading-relaxed text-gray-600 lg:text-[15px]">
            {help}
          </p>
        )}
        <FieldError message={error} />
      </div>
    </div>
  );
}

function SideCard({ children, className = "" }) {
  return (
    <div
      className={`rounded-2xl p-6.5 shadow-[0_2px_14px_rgba(31,35,40,.06)] ${className}`}
    >
      {children}
    </div>
  );
}

export default function ContactPage() {
  const [state, formAction, isPending] = useActionState(
    sendContactEmail,
    initialState,
  );

  // 制御コンポーネントにして、バリデーションエラーで再描画されても入力内容を保持する。
  const [values, setValues] = useState(EMPTY_VALUES);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  if (state.success) {
    return (
      <div className="bg-[#F1F5FD] px-6 py-16 lg:py-28" style={{ fontFamily }}>
        <div className="mx-auto max-w-130 text-center">
          <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-blue-600">
            <Check className="size-7.5 text-white" strokeWidth={3} />
          </div>
          <h1 className="mb-3.5 text-2xl font-bold leading-relaxed text-[#1F2328] lg:text-4xl">
            送信が完了しました
          </h1>
          <p className="mb-7 text-base leading-loose text-gray-600 lg:text-[17px]">
            ご入力いただいたメールアドレスに受付確認メールをお送りしました。担当者より
            <span className="text-[17px] font-bold text-[#1F2328] lg:text-[19px]">
              2〜3
            </span>
            営業日以内にご返信します。
          </p>
          <Link
            href="/"
            className="block rounded-lg bg-blue-600 py-4.5 text-lg font-bold text-white transition-colors hover:bg-blue-700 lg:mx-auto lg:w-85"
          >
            トップページへ戻る
          </Link>
          <Link
            href="/mentors"
            className="mt-4 inline-block text-base font-medium text-[#2F5FD0] hover:underline"
          >
            メンターを探す　→
          </Link>
        </div>
      </div>
    );
  }

  const errorCount = FIELD_KEYS.filter(
    (key) => state.errors?.[key]?.length,
  ).length;

  return (
    <div className="bg-white lg:bg-[#F9FAFC]" style={{ fontFamily }}>
      <section className="border-b border-[#E4E7EB] bg-[#F1F5FD] px-5.5 py-9 lg:px-16 lg:py-18 lg:text-center">
        <p className="mb-3.5 text-xs font-medium tracking-[0.1em] text-blue-600 lg:mb-4.5 lg:text-[13px] lg:tracking-[0.12em]">
          CONTACT
        </p>
        <h1 className="mb-4 text-3xl font-bold leading-[1.55] tracking-tight text-[#1F2328] lg:mb-4.5 lg:text-[40px]">
          お問い合わせ
        </h1>
        <p className="text-base leading-loose text-gray-600 lg:mx-auto lg:max-w-150 lg:text-[17px]">
          サービスについてのご質問・ご相談は、こちらのフォームからお送りください。担当者より
          <span className="text-[17px] font-bold text-[#1F2328] lg:text-[19px]">
            2〜3
          </span>
          営業日以内にご返信します。
        </p>
      </section>

      {/* デスクトップではサイドバーの「お問い合わせの前に」カードが同じ役割を担う。 */}
      <div className="flex items-start gap-3 border-b border-[#ECEEF1] bg-[#F9FAFC] px-5.5 py-4 lg:hidden">
        <Info className="mt-0.5 size-5 shrink-0 text-blue-600" />
        <p className="text-sm leading-loose text-gray-600">
          面談の予約・キャンセルは
          <Link href="/dashboard" className="font-bold text-[#1F2328] hover:underline">
            マイページ
          </Link>
          から行えます。よくある質問は
          <Link href="/#faq" className="font-bold text-[#1F2328] hover:underline">
            こちら
          </Link>
          。
        </p>
      </div>

      <div className="mx-auto flex max-w-400 flex-col items-start justify-center gap-6 lg:flex-row lg:gap-12 lg:px-16 lg:py-16">
        <form
          action={formAction}
          className="flex w-full flex-col gap-6.5 px-5.5 py-8 lg:w-250 lg:gap-8 lg:rounded-2xl lg:bg-white lg:px-14 lg:py-12 lg:shadow-[0_2px_14px_rgba(31,35,40,.06)]"
        >
          {state.errors?._form && (
            <div className="flex items-start gap-2.5 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3.5">
              <AlertCircle className="mt-0.5 size-5 shrink-0 text-red-600" />
              <p className="text-[15px] font-medium leading-relaxed text-red-700">
                {state.errors._form[0]}
              </p>
            </div>
          )}

          {errorCount > 0 && (
            <div className="flex items-start gap-2.5 rounded-[10px] border border-[#E4E7EB] bg-[#F9FAFC] px-4 py-3.5">
              <AlertCircle className="mt-0.5 size-5 shrink-0 text-red-600" />
              <p className="text-[15px] font-medium leading-relaxed text-[#1F2328]">
                入力内容に誤りがあります。
                <span className="font-normal text-gray-600">
                  以下の
                  <span className="text-base font-bold text-[#1F2328]">
                    {errorCount}
                  </span>
                  件をご確認ください。
                </span>
              </p>
            </div>
          )}

          <Field label="お名前" htmlFor="name" error={state.errors?.name?.[0]}>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="山田 太郎"
              value={values.name}
              onChange={handleChange}
              className={inputClass(state.errors?.name)}
            />
          </Field>

          <Field
            label="メールアドレス"
            htmlFor="email"
            error={state.errors?.email?.[0]}
          >
            <input
              id="email"
              name="email"
              type="email"
              placeholder="example@mail.com"
              value={values.email}
              onChange={handleChange}
              className={inputClass(state.errors?.email)}
            />
          </Field>

          <Field
            label="メールアドレス（確認用）"
            htmlFor="email_re"
            error={state.errors?.email_re?.[0]}
            help="確認のため、同じメールアドレスをご入力ください。"
          >
            <input
              id="email_re"
              name="email_re"
              type="email"
              placeholder="もう一度ご入力ください"
              value={values.email_re}
              onChange={handleChange}
              className={inputClass(state.errors?.email_re)}
            />
          </Field>

          <Field
            label="お問い合わせ内容"
            htmlFor="message"
            error={state.errors?.message?.[0]}
          >
            <textarea
              id="message"
              name="message"
              rows={6}
              placeholder="ご質問・ご相談の内容をご記入ください"
              value={values.message}
              onChange={handleChange}
              className={`${inputClass(state.errors?.message)} h-40 resize-none leading-loose lg:h-50`}
            />
          </Field>

          <div className="flex flex-col items-center gap-4 border-t border-[#ECEEF1] pt-6.5 lg:pt-8">
            <p className="text-center text-sm leading-relaxed text-gray-600 lg:text-[15px]">
              送信をもって
              <Link href="/privacy" className="text-[#2F5FD0] underline">
                プライバシーポリシー
              </Link>
              に同意したものとみなします。
            </p>
            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-lg bg-blue-600 py-4.5 text-lg font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 lg:w-85"
            >
              {isPending ? "送信中…" : "送信する"}
            </button>
            <p className="text-center text-sm leading-relaxed text-gray-500">
              確認画面はありません。内容をご確認のうえ送信してください。
            </p>
          </div>
        </form>

        <aside className="hidden w-120 shrink-0 flex-col gap-4 lg:flex">
          <SideCard className="bg-white">
            <div className="mb-3.5 flex items-center gap-2.5">
              <HelpCircle className="size-5.5 text-blue-600" />
              <h2 className="text-[17px] font-bold text-[#1F2328]">
                お問い合わせの前に
              </h2>
            </div>
            <p className="mb-4 text-[15px] leading-loose text-gray-600">
              面談の予約・キャンセル方法、料金、メンターの選び方は、よくある質問で解決できる場合があります。
            </p>
            <Link
              href="/#faq"
              className="text-base font-medium text-[#2F5FD0] hover:underline"
            >
              よくある質問を見る　→
            </Link>
          </SideCard>

          <SideCard className="bg-[#F1F5FD] shadow-none">
            <p className="mb-3 text-xs font-medium tracking-[0.08em] text-blue-600">
              RESPONSE TIME
            </p>
            <p className="mb-2 text-3xl font-bold leading-tight text-[#1F2328]">
              2〜3
              <span className="ml-1.5 text-[17px] font-bold text-gray-600">
                営業日
              </span>
            </p>
            <p className="text-sm leading-loose text-gray-600">
              土日祝を除く。内容によってはお時間をいただく場合があります。
            </p>
          </SideCard>

          <SideCard className="border border-[#E4E7EB] bg-white shadow-none">
            <h2 className="mb-3.5 text-[17px] font-bold text-[#1F2328]">
              メンター希望の方へ
            </h2>
            <p className="mb-4 text-[15px] leading-loose text-gray-600">
              大学生メンターへのご応募は、専用ページから受け付けています。
            </p>
            <Link
              href="/recruitment"
              className="text-base font-medium text-[#2F5FD0] hover:underline"
            >
              メンター募集ページ　→
            </Link>
          </SideCard>
        </aside>
      </div>
    </div>
  );
}
