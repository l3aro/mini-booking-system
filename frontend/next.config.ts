import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "/api",
    API_INTERNAL_URL: process.env.API_INTERNAL_URL || "http://nginx/api",
  },
};

export default nextConfig;
