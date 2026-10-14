import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tắt Cache Components để dùng behavior Next.js 15 (dynamic khi có cookie/auth).
  // Next.js 16 mặc định bật, nhưng gây lỗi "unstable value Date.now()"
  // với layout đọc session.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;