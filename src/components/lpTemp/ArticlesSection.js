import Link from "next/link";
import Image from "next/image";
import { FileText } from "lucide-react";

const API_URL = process.env.API_URL;
const API_KEY = process.env.API_KEY;

export default async function ArticlesSection() {
  const result = await fetch(`${API_URL}blogs?limit=2`, {
    headers: {
      "X-MICROCMS-API-KEY": API_KEY,
    },
    next: { revalidate: 10, tags: ["blog"] },
  }).then((res) => res.json());

  const articles = result?.contents ?? [];
  if (articles.length === 0) return null;

  return (
    <section className="bg-slate-50 py-14 lg:py-24 px-6">
      <div className="max-w-350 mx-auto">
        <div className="flex items-start justify-between mb-6 lg:mb-11">
          <div>
            <h2 className="text-2xl lg:text-4xl font-bold text-slate-900 mb-2 lg:mb-3">
              受験のヒント
            </h2>
            <p className="text-base text-slate-600">
              メンターの体験をもとにした記事を公開しています。
            </p>
          </div>
          <Link
            href="/articles/1"
            className="hidden lg:block shrink-0 pt-2 font-bold text-blue-600"
          >
            記事をもっと読む　→
          </Link>
        </div>

        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:gap-9">
          {articles.map((article, index) => (
            <Link
              key={article.id}
              href={`/articles/id/${article.id}`}
              className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_14px_rgba(31,35,40,.06)] hover:-translate-y-0.75 hover:shadow-lg transition-all duration-200"
            >
              <div className="relative h-45 lg:h-82.5 bg-slate-200">
                {article.eyecatch?.url ? (
                  <Image
                    src={article.eyecatch.url}
                    alt=""
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileText className="w-8 h-8 text-slate-400" />
                  </div>
                )}
              </div>
              <div className="p-5 lg:p-8">
                <div className="flex items-center gap-3 mb-3.5 lg:mb-5">
                  <span
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                      index === 0
                        ? "bg-blue-50 text-blue-600"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {article.category?.name ?? "記事"}
                  </span>
                  <span className="text-base text-slate-500">
                    {article.updatedAt?.split("T")[0]}
                  </span>
                </div>
                <p className="font-bold text-base lg:text-xl text-slate-900 leading-relaxed">
                  {article.title}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-5.5 text-center lg:hidden">
          <Link href="/articles/1" className="font-bold text-blue-600">
            記事をもっと読む　→
          </Link>
        </div>
      </div>
    </section>
  );
}
