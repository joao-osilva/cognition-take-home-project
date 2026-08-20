import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@repo/ui",
    "@repo/core",
    "@repo/db",
    "@repo/app-kyc",
    "@repo/app-refunds",
    "@repo/app-flags",
  ],
};

export default nextConfig;
