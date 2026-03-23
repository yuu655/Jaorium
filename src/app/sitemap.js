const API_URL = process.env.API_URL;
const API_KEY = process.env.API_KEY;

export default async function sitemap() {
  const baseUrl = "https://jaorium.com";

  // 例：外部CMSやDBから全記事のデータを取得
  const articles = await fetch(`${API_URL}blogs?limit=100`, {
    headers: {
      "X-MICROCMS-API-KEY": API_KEY,
    },
    next: { revalidate: 10, tags: ["blog"] },
  }).then((res) => res.json());


  // ブログ記事のURLリストを作成
  const postUrls = articles.contents.map((post) => ({
    url: `${baseUrl}/articles/${post.id}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  // 固定ページのURLリスト
  const routes = ["", "/concept", "/forCompanies", "/mentors", "/articles"].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1.0,
  }));

  return [...routes, ...postUrls];
}