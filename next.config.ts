import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co', // Wildcard for any project
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', // Already used in background
      }
    ],
  },
};

export default nextConfig;
