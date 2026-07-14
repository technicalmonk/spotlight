import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {},
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "openrouter.ai" },
      { protocol: "https", hostname: "raw.githubusercontent.com" },
    ],
  },
};

export default nextConfig;
