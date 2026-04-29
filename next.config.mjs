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
    ],
  },
  turbopack: {
    resolveAlias: {
      canvas: "./empty-module.js", // pdfjs用
    },
  },
};

export default nextConfig;
