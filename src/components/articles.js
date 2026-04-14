import { Button } from "@/components/ui/button";
import Article from "./article";
import Link from "next/link";
const API_URL = process.env.API_URL;
const API_KEY = process.env.API_KEY;

export default async function Articles() {
  const result = await fetch(`${API_URL}blogs?limit=2`, {
    headers: {
      "X-MICROCMS-API-KEY": API_KEY,
    },
    next: { revalidate: 10, tags: ["blog"] },
  }).then((res) => res.json());
  // console.log(result.contents);
  return (
    <div className="bg-white">
      <div className="max-w-300 mx-auto px-4 pt-30 pb-20 flex items-center flex-col">
        <h2 className="text-4xl font-bold text-center">記事・お知らせ</h2>
        <p className="text-center text-xl text-gray-600 pt-3">メンターの合格体験記や、受験生への応援メッセージ</p>
        <ul className="flex flex-col justify-center py-10 gap-10 w-full md:flex-row">

          {result.contents.map((article) => (
            <li key={article.id} className="w-full md:w-1/2">
              <Article
                category={article.category.name}
                time={article.updatedAt}
                title={article.title}
                id={article.id}
              />
            </li>
          ))}
        </ul>
        <Button variant="outline" size="mentor" asChild className="mx-auto">
          <Link className="text-[20px]" href="/articles">記事一覧を見る</Link>
        </Button>
      </div>
    </div>
    );
}
