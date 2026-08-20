import type { Role } from "@repo/core";

export const refundsAppMeta = {
  id: "refunds",
  name: "Refunds Dashboard",
  description: "Create, track, and approve customer refund requests",
  basePath: "/refunds",
  requiredRole: "refunds:operator" satisfies Role,
} as const;
