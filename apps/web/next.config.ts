import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.openfoodfacts.net",
      },
    ],
  },
  /* config options here */
};

export default nextConfig;
