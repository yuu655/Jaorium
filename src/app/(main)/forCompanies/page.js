import { Target, TrendingUp, Users, Award, Heart, Mail } from "lucide-react";
import Image from "next/image";

export default function ForCompanies() {
  return (
    <div className="bg-white min-h-screen">
      {/* Hero */}
      <section className="relative py-20 md:py-32 bg-linear-to-br from-blue-900 to-indigo-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                企業の方へ
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-blue-100">
                社会貢献と採用を、ひとつに。
              </p>
              <p className="text-lg mb-8 text-blue-100 leading-relaxed">
                JaoRiumは、情報格差をなくすという社会課題に、
                企業の力で取り組むプラットフォームです。
                CSR活動と優秀な学生との接点創出を、同時に実現します。
              </p>
              <button className="px-8 py-4 bg-white text-blue-900 text-lg font-medium rounded-lg hover:bg-blue-50 transition-colors">
                資料請求・お問い合わせ
              </button>
            </div>
            <div className="hidden md:block">
              <Image
                src="/photo-1745847768380-2caeadbb3b71.jpg"
                alt="Partnership"
                className="rounded-xl shadow-2xl"
                width={600}
                height={400}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Problem & Solution */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              こんな課題、ありませんか？
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12 mb-16">
            <div className="bg-red-50 p-8 rounded-xl">
              <h3 className="text-2xl font-bold mb-4 text-red-900">採用面での課題</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">×</span>
                  <span>優秀な学生との接点が少ない</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">×</span>
                  <span>採用ブランディングが弱い</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">×</span>
                  <span>地方の学生にリーチできない</span>
                </li>
              </ul>
            </div>

            <div className="bg-orange-50 p-8 rounded-xl">
              <h3 className="text-2xl font-bold mb-4 text-orange-900">CSR面での課題</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold">×</span>
                  <span>形だけのCSR活動になっている</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold">×</span>
                  <span>社会貢献の実感が湧かない</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold">×</span>
                  <span>従業員のエンゲージメントが低い</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="text-center">
            <p className="text-2xl font-bold mb-8">JaoRiumなら、これらを同時に解決できます。</p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              スポンサー企業になるメリット
            </h2>
            <p className="text-lg text-gray-600">
              社会貢献と採用支援を、ひとつのプラットフォームで実現
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-md">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-500 text-white rounded-full mb-6">
                <Users size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">優秀な学生との接点</h3>
              <p className="text-gray-700">
                メンターとして活動する優秀な大学生との接点を創出。採用母集団の形成に貢献します。
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-md">
              <div className="flex items-center justify-center w-16 h-16 bg-green-500 text-white rounded-full mb-6">
                <Heart size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">社会貢献の実感</h3>
              <p className="text-gray-700">
                情報格差という社会課題に直接アプローチ。受験生の人生を変える、本質的なCSR活動です。
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-md">
              <div className="flex items-center justify-center w-16 h-16 bg-purple-500 text-white rounded-full mb-6">
                <TrendingUp size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">ブランド向上</h3>
              <p className="text-gray-700">
                社会課題に真剣に取り組む姿勢が、企業イメージとエンプロイヤーブランドを向上させます。
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-md">
              <div className="flex items-center justify-center w-16 h-16 bg-orange-500 text-white rounded-full mb-6">
                <Target size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">地方人材へのリーチ</h3>
              <p className="text-gray-700">
                地方在住の優秀な学生に、効果的にアプローチできます。多様性のある採用を実現します。
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-md">
              <div className="flex items-center justify-center w-16 h-16 bg-red-500 text-white rounded-full mb-6">
                <Award size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">従業員エンゲージメント</h3>
              <p className="text-gray-700">
                社会貢献活動への参加により、従業員の誇りとエンゲージメントが向上します。
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-md">
              <div className="flex items-center justify-center w-16 h-16 bg-indigo-500 text-white rounded-full mb-6">
                <Mail size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">PR・広報機会</h3>
              <p className="text-gray-700">
                プレスリリース、メディア露出、SNS発信など、多様な広報機会を提供します。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sponsorship Plans */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              スポンサープラン
            </h2>
            <p className="text-lg text-gray-600">
              貴社のニーズに合わせた、柔軟なスポンサーシッププランをご用意
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Bronze */}
            <div className="bg-white border-2 border-gray-200 p-8 rounded-xl">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">ブロンズ</h3>
                <p className="text-gray-600 mb-4">スタート支援</p>
                <p className="text-4xl font-bold">¥50万</p>
                <p className="text-gray-500">/年</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>ロゴ掲載（Webサイト）</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>プレスリリース記載</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>活動報告レポート</span>
                </li>
              </ul>
              <button className="w-full py-3 border-2 border-black text-black font-medium rounded-lg hover:bg-black hover:text-white transition-colors">
                詳細を見る
              </button>
            </div>

            {/* Silver */}
            <div className="bg-white border-2 border-gray-200 p-8 rounded-xl">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">シルバー</h3>
                <p className="text-gray-600 mb-4">標準プラン</p>
                <p className="text-4xl font-bold">¥150万</p>
                <p className="text-gray-500">/年</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>ブロンズの全特典</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>メンター推薦機会</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>企業紹介記事掲載</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>イベント共催権</span>
                </li>
              </ul>
              <button className="w-full py-3 border-2 border-black text-black font-medium rounded-lg hover:bg-black hover:text-white transition-colors">
                詳細を見る
              </button>
            </div>

            {/* Gold */}
            <div className="bg-linear-to-br from-yellow-50 to-amber-50 border-2 border-yellow-400 p-8 rounded-xl relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-yellow-400 text-yellow-900 text-sm font-bold rounded-full">
                おすすめ
              </div>
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">ゴールド</h3>
                <p className="text-gray-600 mb-4">プレミアムプラン</p>
                <p className="text-4xl font-bold">¥300万</p>
                <p className="text-gray-500">/年</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>シルバーの全特典</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>優先メンター推薦</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>専用ランディングページ</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>メンター向けセミナー開催</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>月次ミーティング</span>
                </li>
              </ul>
              <button className="w-full py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors">
                詳細を見る
              </button>
            </div>
          </div>

          <p className="text-center text-gray-600 mt-8">
            ※カスタムプランも承ります。お気軽にご相談ください。
          </p>
        </div>
      </section>

      {/* Testimonials (placeholder) */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              スポンサー企業の声
            </h2>
            <p className="text-lg text-gray-600">
              （準備中）
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-linear-to-r from-blue-900 to-indigo-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            一緒に、未来を変えませんか？
          </h2>
          <p className="text-xl mb-10 text-blue-100">
            情報格差をなくすという社会課題に、<br />
            貴社の力を貸してください。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-white text-blue-900 text-lg font-medium rounded-lg hover:bg-blue-50 transition-colors">
              資料をダウンロード
            </button>
            <button className="px-8 py-4 border-2 border-white text-white text-lg font-medium rounded-lg hover:bg-white hover:text-blue-900 transition-colors">
              お問い合わせ
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}