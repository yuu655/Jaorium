import Image from "next/image";
import Link from "next/link";
const API_URL = process.env.API_URL;
const API_KEY = process.env.API_KEY;
import ArticleList from "../../components/articleList";

import { Calendar, Tag, ArrowRight } from "lucide-react";
import Article from "@/components/article";

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
