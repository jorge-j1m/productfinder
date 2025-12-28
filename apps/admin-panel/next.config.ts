import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow external images from any domain for placeholder logos
    // In production, replace with specific allowed domains
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
