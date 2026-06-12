/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@line/bot-sdk"],
  },
};

export default nextConfig;
