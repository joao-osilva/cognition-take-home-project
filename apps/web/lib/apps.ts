import { flagsAppMeta } from "@repo/app-flags";
import { kycAppMeta } from "@repo/app-kyc";
import { refundsAppMeta } from "@repo/app-refunds";

// Lightweight app list read by the launcher and nav. One entry per app package.
export const apps = [kycAppMeta, refundsAppMeta, flagsAppMeta] as const;
