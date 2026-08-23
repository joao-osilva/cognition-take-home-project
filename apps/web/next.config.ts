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
  experimental: {
    serverActions: {
      // KYC document uploads (max 10 MB) travel through a Server Action.
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
