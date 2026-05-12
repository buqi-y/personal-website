import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
      },
      {
        protocol: "https",
        hostname: "**.cos.ap-guangzhou.myqcloud.com",
      },
      {
        protocol: "https",
        hostname: "**.cos.ap-shanghai.myqcloud.com",
      },
    ],
  },
};

export default nextConfig;
