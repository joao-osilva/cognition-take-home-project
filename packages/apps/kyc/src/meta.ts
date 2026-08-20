import type { Role } from "@repo/core";

export const kycAppMeta = {
  id: "kyc",
  name: "KYC Review Queue",
  description: "Review, decide, and escalate customer KYC cases",
  basePath: "/kyc",
  requiredRole: "kyc:operator" satisfies Role,
} as const;
