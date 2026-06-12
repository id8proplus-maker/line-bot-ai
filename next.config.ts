import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@line/bot-sdk"],
  },
};

export default nextConfig;
