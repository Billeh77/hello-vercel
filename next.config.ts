import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.almostcrackd.ai',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
