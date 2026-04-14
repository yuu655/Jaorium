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


};

export default nextConfig;
