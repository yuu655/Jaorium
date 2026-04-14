import Image from "next/image";
import Link from "next/link";
const API_URL = process.env.API_URL;
const API_KEY = process.env.API_KEY;
import ArticleList from "./components/articleList";

import { Calendar, Tag, ArrowRight } from "lucide-react";

export default async function Articles() {
  const articles = await fetch(`${API_URL}blogs?limit=100`, {
    headers: {
      "X-MICROCMS-API-KEY": API_KEY,
    },
    next: { revalidate: 10, tags: ["blog"] },
  }).then((res) => res.json());

  const categories = await fetch(`${API_URL}categories?limit=10`, {
    headers: {
      "X-MICROCMS-API-KEY": API_KEY,
    },
    next: { revalidate: 60 },
  }).then((res) => res.json());
  // console.log(articles.contents);
  console.log(articles);
  return (
    <ArticleList articles={articles}>
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
                    {articles.contents[0].category.name}
                  </span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  {articles.contents[0].title}
                </h2>
                <p className="text-lg text-gray-700 mb-6">
                  {articles.contents[0].excerpt}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span>{articles.contents[0].updatedAt}</span>
                  </div>
                  {/* <span>by {articles.contents[0].author.name}</span> */}
                </div>
                <Link href={`/articles/${articles.contents[0].id}`}>
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
                  src={articles.contents[0].eyecatch.url}
                  fill
                  className="object-cover rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </ArticleList>
  );
}
