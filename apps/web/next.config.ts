import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    // The design-records docs page reads these markdown files at request time.
    "/docs/tbd": ["../../docs/architecture/*.md"],
    "/docs/architecture/assets/[name]": ["../../docs/architecture/*.svg"],
    "/docs/architecture/pdf": ["../../docs/architecture/*.png"],
  },
  // Keep react-pdf unbundled so pdfkit's runtime font data files (*.afm)
  // are traced into the serverless function instead of breaking on ENOENT.
  serverExternalPackages: ["@react-pdf/renderer"],
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
