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
  turbopack: {
    resolveAlias: {
      canvas: "./empty-module.js", // pdfjs用
    },
  },
};

export default nextConfig;
