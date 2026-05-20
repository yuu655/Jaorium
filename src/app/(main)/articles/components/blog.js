import Image from "next/image";
import ExitButton from "../components/button";
import { Calendar } from "lucide-react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');
 
  /* ── ページ全体 ── */
  .blog-page {
    background: #fff;
    min-height: 100vh;
  }
 
  /* ── ヘッダーエリア ── */
  .blog-header {
    max-width: 720px;
    margin: 0 auto;
    padding: 52px 24px 36px;
    border-bottom: 0.5px solid #e8e8e8;
  }
 
  /* カテゴリバッジ */
  .blog-badge {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: #f3f3f3;
    color: #444;
    font-family: 'DM Sans', sans-serif;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 5px 13px;
    border-radius: 999px;
    margin-bottom: 24px;
  }
  .blog-badge-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: linear-gradient(135deg, #f97316, #ec4899);
    flex-shrink: 0;
  }
 
  /* タイトル */
  .blog-title {
    font-family: 'Syne', sans-serif;
    font-size: clamp(32px, 5vw, 52px);
    font-weight: 800;
    line-height: 1.08;
    letter-spacing: -0.04em;
    margin: 0 0 22px;
    background: linear-gradient(105deg, #1a1a1a 0%, #f97316 45%, #ec4899 75%, #8b5cf6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
 
  /* メタ情報 */
  .blog-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    color: #999;
    letter-spacing: 0.02em;
  }
  .blog-meta svg {
    width: 14px;
    height: 14px;
    color: #bbb;
  }
 
  /* ── アイキャッチ ── */
  .blog-eyecatch {
    max-width: 720px;
    margin: 32px auto;
    padding: 0 24px;
  }
  .blog-eyecatch-img {
    width: 100%;
    border-radius: 8px;
    display: block;
  }
 
  /* ── 本文エリア ── */
  .blog-article {
    max-width: 720px;
    margin: 0 auto;
    padding: 8px 24px 80px;
  }
 
  /* ── article-body（CMSから来るHTML） ── */
  .article-body {
    font-family: 'DM Serif Display', 'Noto Serif JP', Georgia, serif;
    font-size: 17px;
    line-height: 1.92;
    color: #1a1a1a;
  }
 
  .article-body p {
    margin: 0 0 1.5rem;
  }
 
  /* h2 */
  .article-body h2 {
    font-family: 'Syne', sans-serif;
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.02em;
    margin: 2.75rem 0 1rem;
    color: #1a1a1a;
  }
 
  /* h3 */
  .article-body h3 {
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    font-weight: 500;
    letter-spacing: 0.02em;
    margin: 2rem 0 0.75rem;
    color: #555;
  }
 
  /* リンク */
  .article-body a {
    color: #f97316;
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 3px;
  }
 
  /* リスト */
  .article-body ul,
  .article-body ol {
    padding-left: 0;
    list-style: none;
    margin: 0 0 1.5rem;
  }
  .article-body li {
    position: relative;
    padding-left: 20px;
    margin-bottom: 0.65rem;
    line-height: 1.8;
  }
  .article-body ul li::before {
    content: '';
    position: absolute;
    left: 0;
    top: 11px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: linear-gradient(135deg, #f97316, #ec4899);
  }
  .article-body ol {
    counter-reset: ol-counter;
  }
  .article-body ol li {
    counter-increment: ol-counter;
  }
  .article-body ol li::before {
    content: counter(ol-counter);
    position: absolute;
    left: 0;
    top: 1px;
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    font-weight: 500;
    color: #f97316;
  }
 
  /* ブロッククォート */
  .article-body blockquote {
    font-style: italic;
    font-size: 20px;
    line-height: 1.6;
    margin: 2.5rem 0;
    padding: 20px 24px;
    border-radius: 8px;
    background: linear-gradient(105deg, rgba(249,115,22,0.07), rgba(236,72,153,0.06));
    border-left: 3px solid #f97316;
    color: #1a1a1a;
  }
 
  /* インラインコード */
  .article-body code {
    font-family: 'DM Mono', 'Fira Code', monospace;
    font-size: 13px;
    background: #f4f4f4;
    padding: 2px 7px;
    border-radius: 4px;
    color: #1a1a1a;
  }
 
  /* コードブロック */
  .article-body pre {
    background: #f8f8f8;
    border: 0.5px solid #eee;
    border-radius: 8px;
    padding: 1.25rem 1.5rem;
    overflow-x: auto;
    margin: 0 0 1.75rem;
  }
  .article-body pre code {
    background: none;
    padding: 0;
    font-size: 13.5px;
  }
 
  /* 画像 */
  .article-body img {
    width: 100%;
    border-radius: 8px;
    margin: 0.5rem 0 2rem;
    display: block;
  }
 
  /* テーブル */
  .article-body table {
    width: 100%;
    border-collapse: collapse;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    margin: 0 0 1.75rem;
  }
  .article-body th {
    font-weight: 500;
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    text-align: left;
    padding: 10px 14px;
    border-bottom: 0.5px solid #e0e0e0;
    color: #aaa;
  }
  .article-body td {
    padding: 12px 14px;
    border-bottom: 0.5px solid #f0f0f0;
    vertical-align: top;
  }
 
  /* 水平線 */
  .article-body hr {
    border: none;
    border-top: 0.5px solid #eee;
    margin: 3rem 0;
  }
`;

export default function Blog({ isDraft, result }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <div className="blog-page">
        {/* ── ヘッダー：カテゴリ・タイトル・メタ ── */}
        <div className="blog-header">
          <span className="blog-badge">
            <span className="blog-badge-dot" />
            {result.category.name}
          </span>
          <h1 className="blog-title">{result.title}</h1>
          <div className="blog-meta">
            <Calendar size={14} />
            <span>{result.updatedAt}</span>
          </div>
        </div>

        {/* ── アイキャッチ画像（小さめ） ── */}
        <div className="blog-eyecatch">
          <img
            src={result.eyecatch.url}
            alt={result.title}
            width={result.eyecatch.width}
            height={result.eyecatch.height}
            className="blog-eyecatch-img"
          />
        </div>

        {/* ── 本文 ── */}
        <article className="blog-article">
          <div
            className="article-body"
            dangerouslySetInnerHTML={{ __html: result.content }}
          />
        </article>
      </div>

      {isDraft && <ExitButton redirectTo="/" />}
    </>
  );
}
