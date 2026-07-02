import Image from "next/image";
import Link from "next/link";
const API_URL = process.env.API_URL;
const API_KEY = process.env.API_KEY;
import ArticleList from "../../components/articleList";

import { Calendar, Tag, ArrowRight } from "lucide-react";
import Article from "@/components/article";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const result = await fetch(`${API_URL}categories/${id}`, {
    next: { revalidate: 3600, tags: ["categories"] },
    headers: {
      "X-MICROCMS-API-KEY": API_KEY,
    },
  }).then((res) => res.json());
  return {
    title: `${result.name} | 記事一覧`,
    description: `${result.name}に関する記事一覧`,
  };
}

export default async function ArticlesCategory({params}) {
  const { id } = await params;
  const articles = await fetch(`${API_URL}blogs?filters=category[equals]${id}&limit=100`, {
    headers: {
      "X-MICROCMS-API-KEY": API_KEY,
    },
    next: { revalidate: 3600, tags: ["blog"] },
  }).then((res) => res.json());
  return (
    <ArticleList articles={articles}></ArticleList>
  );
}
