import Image from "next/image";
import Link from "next/link";
const API_URL = process.env.API_URL;
const API_KEY = process.env.API_KEY;
import ArticleList from "../components/articleList";

import { Calendar, Tag, ArrowRight } from "lucide-react";
import { createExhaustiveParamsProxy } from "next/dist/server/app-render/instant-validation/instant-samples";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const currentPage = Number(id);
  return {
    title: currentPage === 1 ? "記事一覧" : `記事一覧 - ${currentPage}ページ目`,
    description: "投稿する記事の一覧",
  };
}

export default async function Articles({params}) {
  const { id } = await params;
  const currentPage = Number(id);
  const limit = 10; // 1ページあたりの記事数

  const firstArticle = await fetch(`${API_URL}blogs?limit=1`, {
    headers: {
      "X-MICROCMS-API-KEY": API_KEY,
    },
    next: { revalidate: 3600, tags: ["blog"] },
  }).then((res) => res.json());

  const articles = await fetch(
    `${API_URL}blogs?limit=${limit}&offset=${(currentPage - 1) * limit}`,
    {
      headers: {
        "X-MICROCMS-API-KEY": API_KEY,
      },
      next: { revalidate: 10, tags: ["blog"] },
    }
  ).then((res) => res.json());

  // articles.totalCount で総記事数が取れる
  const totalPages = Math.ceil(articles.totalCount / limit);
  const categories = await fetch(`${API_URL}categories?limit=10`, {
    headers: {
      "X-MICROCMS-API-KEY": API_KEY,
    },
    next: { revalidate: 60 },
  }).then((res) => res.json());
  return (
    <ArticleList firstArticle={firstArticle} articles={articles} totalPages={totalPages} categories={categories} currentPage={currentPage}></ArticleList>
  );
}
