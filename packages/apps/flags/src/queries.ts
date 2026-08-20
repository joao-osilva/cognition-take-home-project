import { platformSchema, type Db } from "@repo/db";
import { and, asc, eq, isNull } from "@repo/db/orm";

import { featureFlags } from "./schema";

export type FeatureFlag = typeof featureFlags.$inferSelect;

export interface PendingFlagChange {
  approvalId: string;
  requestedBy: string;
  proposedState: string;
}

export interface FlagGroup {
  key: string;
  description: string;
  environments: Partial<Record<"dev" | "staging" | "prod", FeatureFlag>>;
  pendingProdChange?: PendingFlagChange;
}

export async function listFlagGroups(db: Db): Promise<FlagGroup[]> {
  const flags = await db.select().from(featureFlags).orderBy(asc(featureFlags.key));
  const pending = await db
    .select()
    .from(platformSchema.approvals)
    .where(
      and(
        eq(platformSchema.approvals.entityType, "feature_flag"),
        isNull(platformSchema.approvals.decision),
      ),
    );

  const groups = new Map<string, FlagGroup>();
  for (const flag of flags) {
    let group = groups.get(flag.key);
    if (!group) {
      group = { key: flag.key, description: flag.description, environments: {} };
      groups.set(flag.key, group);
    }
    group.environments[flag.environment as "dev" | "staging" | "prod"] = flag;
    if (flag.environment === "prod") {
      const approval = pending.find((a) => a.entityId === flag.id);
      if (approval) {
        const snapshot = (approval.ruleSnapshot ?? {}) as { state?: string };
        group.pendingProdChange = {
          approvalId: approval.id,
          requestedBy: approval.requestedBy,
          proposedState: snapshot.state ?? "on",
        };
      }
    }
  }
  return [...groups.values()];
}
