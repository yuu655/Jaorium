// import Image from "next/image";
import Link from "next/link";
import { Target, Briefcase, TrendingUp, Mail } from "lucide-react";

export default function ForCompany() {
    return(
        <section className="py-20 md:py-28 bg-linear-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              企業の皆様へ
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              JaoRiumは、教育格差の是正を目指すソーシャルビジネスです。
              <br />
              次世代の育成をご支援いただける企業様を募集しています。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* 採用ブランディング */}
            <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 hover:border-blue-500 transition-colors">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-6 mx-auto">
                <Briefcase size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-center">
                採用ブランディング
              </h3>
              <p className="text-gray-300 text-center">
                意欲ある学生層への早期認知形成と、理念共感型の採用に。
              </p>
            </div>

            {/* CSR・SDGs */}
            <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 hover:border-green-500 transition-colors">
              <div className="flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-6 mx-auto">
                <Target size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-center">CSR・SDGs</h3>
              <p className="text-gray-300 text-center">
                教育格差の是正という社会課題解決への直接的な貢献。
              </p>
            </div>

            {/* Z世代マーケティング */}
            <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 hover:border-purple-500 transition-colors">
              <div className="flex items-center justify-center w-16 h-16 bg-purple-600 rounded-full mb-6 mx-auto">
                <TrendingUp size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-center">
                Z世代マーケティング
              </h3>
              <p className="text-gray-300 text-center">
                リアルな学生の声やインサイトを活用した商品開発・調査。
              </p>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/forCompanies"
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white text-lg font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
            >
              <Mail size={20} />
              協賛・連携のお問い合わせ
            </Link>
          </div>
        </div>
      </section>
    );
}