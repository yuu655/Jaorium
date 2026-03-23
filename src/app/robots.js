// app/robots.js

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/dashboard/"], // クロール拒否するパス
    },
    sitemap: "https://jaorium.com/sitemap.xml",
  };
}