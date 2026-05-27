import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.webability.io" },
      { protocol: "https", hostname: "webability.io" },
    ],
  },
};

export default nextConfig;
