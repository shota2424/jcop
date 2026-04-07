import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow external image domains if needed
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'profile.line-scdn.net',
      },
    ],
  },
  // Suppress hydration warnings for LIFF
  reactStrictMode: true,
};

export default nextConfig;
