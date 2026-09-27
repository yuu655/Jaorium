/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.microcms-assets.io",
      },
      {
        protocol: "https",
        hostname: "rmjjlkxqtrpuhemmjlun.supabase.co",
      },
      {
        protocol: "https",
        hostname: "pub-82fd75c747c5482d817c65b49817a015.r2.dev",
      },
    ],
  },
  // 面談資料PDFの生成（src/lib/meetingSlide）で fs から読む日本語フォントを
  // サーバーレス関数のバンドルに含める
  outputFileTracingIncludes: {
    "/api/meeting-slide/[meetingId]": ["./src/assets/fonts/**"],
  },
  // subset-font は同梱の HarfBuzz WASM をパッケージ内の相対パスで読むため、バンドルしない
  serverExternalPackages: ["subset-font"],
  turbopack: {
    resolveAlias: {
      canvas: "./empty-module.js", // pdfjs用
    },
  },
};

export default nextConfig;
