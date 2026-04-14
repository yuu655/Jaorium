import Image from "next/image";
import Link from "next/link";
const API_URL = process.env.API_URL;
const API_KEY = process.env.API_KEY;

import { Calendar, Tag, ArrowRight } from "lucide-react";

export default async function Articles({ articles, children }) {
  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <section className="py-16 md:py-24 bg-linear-to-br from-gray-50 to-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-6">
            記事・お知らせ
          </h1>
          <p className="text-xl text-center text-gray-600 max-w-3xl mx-auto">
            メンターの合格体験記、受験ノウハウ、サービスのお知らせなど、
            <br />
            受験生に役立つ情報をお届けします。
          </p>
        </div>
      </section>

      {children}

      {/* Articles Grid */}
      <section className="py-12 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-8">最新記事</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.contents.slice(1).map((article) => (
              <Link href={`/articles/${article.id}`} key={article.id}>
                <article className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group">
                  {/* Thumbnail */}
                  <div className="relative bg-linear-to-br from-gray-200 to-gray-300 h-48 flex items-center justify-center group-hover:opacity-90 transition-opacity rounded-xl">
                    <Image
                      alt="eyecatch"
                      src={article.eyecatch.url}
                      fill
                      className="object-cover rounded-xl"
                    />
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Category & Date */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                        {article.category.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {article.updatedAt}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold mb-2 line-clamp-2 group-hover:text-gray-600 transition-colors">
                      {article.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {article.excerpt}
                    </p>

                    {/* Tags */}
                    {/* <div className="flex flex-wrap gap-2 mb-4">
                    {article.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="flex items-center gap-1 text-xs text-gray-600"
                      >
                        <Tag size={12} />
                        {tag}
                      </span>
                    ))}
                  </div> */}

                    {/* Author */}
                    {/* <p className="text-xs text-gray-500">
                      by {article.author.name}
                    </p> */}
                  </div>
                </article>
              </Link>
            ))}
          </div>

          {/* Load More */}
          <div className="text-center mt-12">
            <button className="px-8 py-3 border-2 border-black text-black font-medium rounded-lg hover:bg-black hover:text-white transition-colors">
              もっと見る
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
