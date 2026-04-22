export default function PrivacyPage() {
  const sections = [
    {
      num: "01",
      title: "基本方針",
      content: (
        <p>
          <Placeholder text="[運営者名]" />
          （以下「当方」）は、jaorium（以下「本サービス」）の運営において、ユーザーの個人情報を適切に取り扱うことを重要な責務と考えています。本プライバシーポリシーは、本サービスにおける個人情報の収集・利用・管理について定めるものです。
        </p>
      ),
    },
    {
      num: "02",
      title: "収集する情報",
      content: (
        <>
          <p>本サービスでは、以下の情報を収集することがあります。</p>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li><strong>メールアドレス</strong>：アカウント登録・認証・お問い合わせ対応のため</li>
            <li><strong>氏名</strong>：アカウント管理・サービス提供のため</li>
            <li><strong>Cookie・アクセスログ</strong>：サービスの利便性向上・利用状況の分析のため</li>
          </ul>
          <p>メンターの方は上記に加え、以下の情報を収集することがあります。</p>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li><strong>大学名・専攻</strong>：メンターサービスの提供のため</li>
          </ul>
          <div className="mt-4 border-l-4 border-emerald-600 bg-emerald-50 px-4 py-3 rounded-r text-sm text-emerald-800">
            Cookie はブラウザの設定によって無効化することができます。ただし、一部の機能が正常に動作しない場合があります。
          </div>
        </>
      ),
    },
    {
      num: "03",
      title: "情報の利用目的",
      content: (
        <>
          <p>収集した情報は、以下の目的のために利用します。</p>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>本サービスのアカウント管理・認証</li>
            <li>サービスの提供・改善・新機能の開発</li>
            <li>お問い合わせへの対応</li>
            <li>サービスに関する重要なお知らせの送信</li>
            <li>利用規約への違反行為への対応</li>
          </ul>
        </>
      ),
    },
    {
      num: "04",
      title: "第三者への提供",
      content: (
        <>
          <p>当方は、以下の場合を除き、ユーザーの個人情報を第三者に提供・開示しません。</p>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>ユーザー本人の同意がある場合</li>
            <li>法令に基づく場合</li>
            <li>人の生命・身体・財産の保護に必要な場合</li>
          </ul>
          <hr className="my-4 border-stone-200" />
          <p>本サービスでは、以下の外部サービスを利用しており、これらのサービスに必要な範囲でデータが共有される場合があります。</p>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>
              <strong>Supabase</strong>（認証・データベース管理）：
              <a
                href="https://supabase.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 underline underline-offset-2 hover:text-emerald-900 transition-colors"
              >
                Supabase プライバシーポリシー
              </a>
            </li>
          </ul>
        </>
      ),
    },
    {
      num: "05",
      title: "Cookie について",
      content: (
        <>
          <p>
            本サービスは、Cookie およびこれに類する技術を利用しています。Cookie はサービスの利便性向上・セッション管理・アクセス解析のために使用されます。
          </p>
          <p className="mt-2">
            ユーザーはブラウザの設定から Cookie の受け入れを拒否することができますが、一部のサービス機能が利用できなくなる場合があります。
          </p>
        </>
      ),
    },
    {
      num: "06",
      title: "情報の管理・安全対策",
      content: (
        <>
          <p>
            当方は、収集した個人情報を適切に管理し、不正アクセス・漏洩・改ざん・紛失を防ぐために合理的な安全対策を講じます。
          </p>
          <p className="mt-2">
            本サービスではユーザー認証に Supabase を採用しており、パスワード等の機密情報は適切に暗号化されて管理されます。
          </p>
        </>
      ),
    },
    {
      num: "07",
      title: "ユーザーの権利",
      content: (
        <>
          <p>ユーザーは、当方が保有する自己の個人情報について、以下の権利を有します。</p>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>個人情報の開示・確認を求める権利</li>
            <li>個人情報の訂正・削除を求める権利</li>
            <li>個人情報の利用停止を求める権利</li>
          </ul>
          <p className="mt-2">上記のご要望は、下記お問い合わせ窓口までご連絡ください。</p>
        </>
      ),
    },
    {
      num: "08",
      title: "プライバシーポリシーの変更",
      content: (
        <p>
          当方は、必要に応じて本プライバシーポリシーを変更することがあります。変更後のポリシーは本ページに掲載した時点で効力を生じるものとします。重要な変更がある場合は、サービス内での通知またはメール等でお知らせします。
        </p>
      ),
    },
    {
      num: "09",
      title: "お問い合わせ",
      content: (
        <>
          <p>本プライバシーポリシーに関するご質問・個人情報の取り扱いに関するお問い合わせは、以下までご連絡ください。</p>
          <div className="mt-4 rounded-lg border border-stone-200 bg-white px-5 py-4 text-sm space-y-1">
            <p><span className="font-medium">サービス名</span>：jaorium</p>
            <p><span className="font-medium">運営者</span>：<Placeholder text="[運営者名]" /></p>
            <p><span className="font-medium">メールアドレス</span>：<Placeholder text="[メールアドレス]" /></p>
          </div>
        </>
      ),
    },
  ];
 
  return (
    <div className="min-h-screen bg-stone-50 text-stone-800">
      {/* Header */}
      <header className="bg-emerald-900 px-6 py-12 text-center">
        <p className="text-xs tracking-widest text-emerald-300 uppercase mb-2">Privacy Policy</p>
        <h1 className="text-2xl md:text-3xl font-semibold text-white tracking-wide">
          プライバシーポリシー
        </h1>
        <p className="mt-2 text-sm text-emerald-400 tracking-widest">jaorium</p>
      </header>
 
      {/* Main */}
      <main className="mx-auto max-w-2xl px-5 py-12">
        {/* Meta */}
        <div className="flex justify-between items-center text-xs text-stone-400 border-b border-stone-200 pb-4 mb-10">
          <span>jaorium プライバシーポリシー</span>
          <span>
            制定日：<Placeholder text="[制定日]" />
          </span>
        </div>
 
        {/* Sections */}
        <div className="space-y-10">
          {sections.map((section) => (
            <section key={section.num}>
              <p className="text-xs tracking-widest text-emerald-700 mb-1">{section.num}</p>
              <h2 className="text-base font-semibold text-emerald-900 border-b border-stone-200 pb-2 mb-4 tracking-wide">
                {section.title}
              </h2>
              <div className="text-sm leading-relaxed text-stone-700 space-y-2">
                {section.content}
              </div>
            </section>
          ))}
        </div>
      </main>
 
      {/* Footer */}
      <footer className="border-t border-stone-200 py-8 text-center text-xs text-stone-400 space-y-1">
        <p>© jaorium — <Placeholder text="[運営者名]" />. All rights reserved.</p>
        <p>
          制定日：<Placeholder text="[制定日]" />　最終更新日：<Placeholder text="[更新日]" />
        </p>
      </footer>
    </div>
  );
}
 
function Placeholder({text}) {
  return (
    <span className="bg-yellow-100 text-yellow-800 rounded px-1 italic text-[0.85em]">
      {text}
    </span>
  );
}