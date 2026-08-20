import type { Role } from "@repo/core";

export const flagsAppMeta = {
  id: "flags",
  name: "Feature Flags",
  description: "Manage feature flags across dev, staging, and prod",
  basePath: "/flags",
  requiredRole: "flags:operator" satisfies Role,
} as const;
