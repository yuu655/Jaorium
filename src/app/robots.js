// app/robots.js

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/"],
      // disallow: ["/admin/", "/dashboard/"], // クロール拒否するパス
    },
    sitemap: "https://www.jaorium.com/sitemap.xml",
  };
}