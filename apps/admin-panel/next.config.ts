import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../../"),
  transpilePackages: [
    "@repo/admin-orpc",
    "@repo/database",
    "@repo/employee-auth",
  ],
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
