import Image from "next/image";
import Link from "next/link";
const API_URL = process.env.API_URL;
const API_KEY = process.env.API_KEY;

import { ChevronLeft, ChevronRight, Calendar, ArrowRight } from "lucide-react";

export default async function Articles({
  firstArticle,
  articles,
  totalPages,
  categories,
  currentPage,
}) {
  const basePath = "/articles";
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

      {/* Category Filter */}
      <section className="py-8 bg-white border-b sticky top-17.5 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {categories.contents.map((category) => (
              <button
                key={category.id}
                className={`px-6 py-2 rounded-full whitespace-nowrap pointer font-medium transition-colors ${
                  category === "すべて"
                    ? "bg-black text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Link href={`/articles/category/${category.id.toLowerCase()}`}>
                  {category.name}
                </Link>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Article */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-2xl overflow-hidden shadow-lg">
            <div className="grid md:grid-cols-2 gap-8 p-8 md:p-12">
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-4 py-1 bg-blue-600 text-white text-sm font-medium rounded-full">
                    注目記事
                  </span>
                  <span className="px-4 py-1 bg-white text-black text-sm font-medium rounded-full">
                    {firstArticle.contents[0].category?.name}
                  </span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  {firstArticle.contents[0].title || "タイトルなし"}
                </h2>
                <p className="text-lg text-gray-700 mb-6">
                  {firstArticle.contents[0].excerpt}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span>{firstArticle.contents[0].updatedAt}</span>
                  </div>
                  {/* <span>by {firstArticle.contents[0].author.name}</span> */}
                </div>
                <Link href={`/articles/id/${firstArticle.contents[0].id}`}>
                  <button className="inline-flex items-center cursor-pointer gap-2 px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors self-start">
                    記事を読む
                    <ArrowRight size={18} />
                  </button>
                </Link>
              </div>
              {/* <div className="bg-linear-to-br from-gray-300 to-gray-400 rounded-xl min-h-75 flex items-center justify-center">
                <Image
                  alt="eyecathch"
                  src={articles.contents[0].eyecatch.url}
                  width={200}
                  height={300}
                  className="mx-auto object-cover"
                />
              </div> */}
              <div className="relative bg-linear-to-br from-gray-300 to-gray-400 rounded-xl min-h-[300px]">
                <Image
                  alt="eyecatch"
                  src={firstArticle.contents[0].eyecatch.url}
                  fill
                  className="object-cover rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-12 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-8">最新記事</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.contents.map((article) => (
              <Link href={`/articles/id/${article.id}`} key={article.id}>
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
          {/* <div className="text-center mt-12">
            <button className="px-8 py-3 border-2 border-black text-black font-medium rounded-lg hover:bg-black hover:text-white transition-colors">
              もっと見る
            </button>
          </div> */}

          <nav
            className="flex items-center justify-center gap-1.5 mt-10"
            aria-label="ページ選択"
          >
            {currentPage > 1 ? (
              <Link
                href={`${basePath}/${currentPage - 1}`}
                className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft size={16} />
              </Link>
            ) : (
              <span className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 text-gray-200 pointer-events-none">
                <ChevronLeft size={16} />
              </span>
            )}

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Link
                key={page}
                href={`${basePath}/${page}`}
                className={`flex items-center justify-center w-9 h-9 rounded-lg border text-sm font-medium transition-colors ${
                  page === currentPage
                    ? "bg-gray-900 text-white border-gray-900"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                }`}
              >
                {page}
              </Link>
            ))}

            {currentPage < totalPages ? (
              <Link
                href={`${basePath}/${currentPage + 1}`}
                className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors"
              >
                <ChevronRight size={16} />
              </Link>
            ) : (
              <span className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 text-gray-200 pointer-events-none">
                <ChevronRight size={16} />
              </span>
            )}
          </nav>
        </div>
      </section>
    </div>
  );
}
