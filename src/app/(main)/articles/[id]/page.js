import Image from "next/image";
import { draftMode } from "next/headers";

import Blog from "../components/blog";
import ExitButton from "../components/button";
const API_URL = process.env.API_URL;
const API_KEY = process.env.API_KEY;

// async function getPost(slug) {
//   const res = await fetch(`https://api.example.com/posts/${slug}`);
//   return res.json();
// }

// 2. メタデータを動的に生成
export async function generateMetadata({ params }) {
  const { id } = await params;
  const result = await fetch(`${API_URL}blogs/${id}`, {
    next: { revalidate: 3600, tags: ["blog"] },
    headers: {
      "X-MICROCMS-API-KEY": API_KEY,
    },
  }).then((res) => res.json());

  return {
    title: `${result.title} | サービス名`,
    description: result.excerpt,
    openGraph: {
      images: [result.eyecatch.url],
    },
  };
}

export async function generateStaticParams() {
  const result = await fetch(`${API_URL}blogs?limit=10`, {
    headers: {
      "X-MICROCMS-API-KEY": API_KEY,
    },
    next: { revalidate: 3600, tags: ["blog"] },
  }).then((res) => res.json());

  return result.contents.map((article) => ({
    id: article.id,
  }));
}

export default async function Page({ params, searchParams }) {
  const { id } = await params;
  const { draftKey } = await searchParams; // searchParams も await が必要

  // 2. draftMode() も await が必要
  const draft = await draftMode();
  const isDraft = draft.isEnabled;

  const endpoint = new URL(`${API_URL}blogs/${id}`);

  // 3. draftKey が存在し、かつプレビューモードの時だけクエリを付与
  if (isDraft && draftKey) {
    endpoint.searchParams.set("draftKey", draftKey);
  }

  // console.log(endpoint.toString());

  const result = await fetch(endpoint.toString(), {
    next: { revalidate: 3600, tags: ["blog"] },
    headers: {
      "X-MICROCMS-API-KEY": API_KEY,
    },
  }).then((res) => res.json());
  // console.log(result);
  return (
    <div className="bg-white min-h-screen">
      <Blog isDraft={isDraft} result={result} />
      
    </div>
  );
}
