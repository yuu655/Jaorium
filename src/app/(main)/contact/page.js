'use client';
 
import { useActionState } from 'react';
import { sendContactEmail } from './actions';
 
const initialState = {};
 
export default function ContactPage() {
  const [state, formAction, isPending] = useActionState(sendContactEmail, initialState);
 
  if (state.success) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <div className="bg-white border border-stone-200 rounded-2xl px-10 py-12 max-w-md w-full text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
            <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <p className="text-stone-500 text-sm tracking-widest uppercase mb-2">Thank you</p>
          <h2 className="text-stone-800 text-xl font-light" style={{ fontFamily: "'Noto Serif JP', serif" }}>
            お問い合わせを受け付けました
          </h2>
          <p className="text-stone-400 text-sm mt-3 leading-relaxed">
            内容を確認の上、折り返しご連絡いたします。
          </p>
        </div>
      </div>
    );
  }
 
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden max-w-lg w-full shadow-sm">
 
        {/* Header */}
        <div className="px-10 pt-9 pb-7 border-b border-stone-100">
          <p className="text-xs tracking-[0.18em] text-stone-400 uppercase mb-2">Contact</p>
          <h1
            className="text-2xl font-light text-stone-800"
          >
            お問い合わせ
          </h1>
        </div>
 
        {/* Form */}
        <form action={formAction} className="px-10 py-8 flex flex-col gap-6">
 
          {/* Global error */}
          {state.errors?._form && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <p className="text-red-600 text-sm">{state.errors._form[0]}</p>
            </div>
          )}
 
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-xs font-medium text-stone-500 tracking-wide">
              お名前<span className="text-red-400 ml-0.5">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="山田 太郎"
              className={`
                w-full rounded-lg px-4 py-2.5 text-sm text-stone-800 bg-stone-50
                border outline-none transition-all duration-150 placeholder:text-stone-300
                focus:bg-white focus:ring-2 focus:ring-blue-100
                ${state.errors?.name
                  ? 'border-red-300 focus:border-red-400'
                  : 'border-stone-200 focus:border-blue-300'}
              `}
            />
            {state.errors?.name && (
              <ErrorMessage message={state.errors.name[0]} />
            )}
          </div>
 
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-medium text-stone-500 tracking-wide">
              メールアドレス<span className="text-red-400 ml-0.5">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="taro@example.com"
              className={`
                w-full rounded-lg px-4 py-2.5 text-sm text-stone-800 bg-stone-50
                border outline-none transition-all duration-150 placeholder:text-stone-300
                focus:bg-white focus:ring-2 focus:ring-blue-100
                ${state.errors?.email
                  ? 'border-red-300 focus:border-red-400'
                  : 'border-stone-200 focus:border-blue-300'}
              `}
            />
            {state.errors?.email && (
              <ErrorMessage message={state.errors.email[0]} />
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email_re" className="text-xs font-medium text-stone-500 tracking-wide">
              メールアドレス（確認）<span className="text-red-400 ml-0.5">*</span>
            </label>
            <input
              id="email_re"
              name="email_re"
              type="email"
              placeholder="taro@example.com"
              className={`
                w-full rounded-lg px-4 py-2.5 text-sm text-stone-800 bg-stone-50
                border outline-none transition-all duration-150 placeholder:text-stone-300
                focus:bg-white focus:ring-2 focus:ring-blue-100
                ${state.errors?.email_re
                  ? 'border-red-300 focus:border-red-400'
                  : 'border-stone-200 focus:border-blue-300'}
              `}
            />
            {state.errors?.email_re && (
              <ErrorMessage message={state.errors.email_re[0]} />
            )}
          </div>
 
          {/* Message */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="message" className="text-xs font-medium text-stone-500 tracking-wide">
              お問い合わせ内容<span className="text-red-400 ml-0.5">*</span>
            </label>
            <textarea
              id="message"
              name="message"
              rows={5}
              placeholder="ご質問・ご要望をご記入ください"
              className={`
                w-full rounded-lg px-4 py-2.5 text-sm text-stone-800 bg-stone-50
                border outline-none transition-all duration-150 placeholder:text-stone-300
                focus:bg-white focus:ring-2 focus:ring-blue-100 resize-none leading-relaxed
                ${state.errors?.message
                  ? 'border-red-300 focus:border-red-400'
                  : 'border-stone-200 focus:border-blue-300'}
              `}
            />
            {state.errors?.message && (
              <ErrorMessage message={state.errors.message[0]} />
            )}
          </div>
 
          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-stone-100">
            <span className="text-xs text-stone-400">
              <span className="text-red-400">*</span> 必須項目
            </span>
            <button
              type="submit"
              disabled={isPending}
              className="
                flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium
                border border-stone-300 text-stone-700 bg-transparent
                hover:bg-stone-50 active:scale-95
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-150
              "
            >
              {isPending ? (
                <>
                  <svg className="w-4 h-4 animate-spin text-stone-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  送信中...
                </>
              ) : (
                <>
                  送信
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
 
function ErrorMessage({ message }) {
  return (
    <p className="flex items-center gap-1.5 text-red-500 text-xs">
      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
      {message}
    </p>
  );
}