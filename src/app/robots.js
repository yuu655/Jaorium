// app/robots.js

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // disallow: ["/"],
      disallow: ["/admin/", "/dashboard/", "/forCompanies"], // クロール拒否するパス
    },
    sitemap: "https://www.jaorium.com/sitemap.xml",
  };
}