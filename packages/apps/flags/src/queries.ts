import { platformSchema, type Db } from "@repo/db";
import { and, asc, eq, ilike, isNotNull, isNull, or } from "@repo/db/orm";

import { featureFlags } from "./schema";

export type FeatureFlag = typeof featureFlags.$inferSelect;

export interface PendingFlagChange {
  approvalId: string;
  requestedBy: string;
  proposedState: string;
  proposedRolloutPercentage: number | null;
}

export interface FlagGroup {
  key: string;
  description: string;
  archived: boolean;
  environments: Partial<Record<"dev" | "staging" | "prod", FeatureFlag>>;
  pendingProdChange?: PendingFlagChange;
}

export interface FlagSnapshot {
  key: string;
  state: string;
  rolloutPercentage: number | null;
}

export async function listFlagsForEnvironment(
  db: Db,
  environment: string,
): Promise<FlagSnapshot[]> {
  return db
    .select({
      key: featureFlags.key,
      state: featureFlags.state,
      rolloutPercentage: featureFlags.rolloutPercentage,
    })
    .from(featureFlags)
    .where(and(eq(featureFlags.environment, environment), isNull(featureFlags.archivedAt)))
    .orderBy(asc(featureFlags.key));
}

export async function listFlagGroups(
  db: Db,
  options: { archived?: boolean; search?: string } = {},
): Promise<FlagGroup[]> {
  const archivedFilter = options.archived
    ? isNotNull(featureFlags.archivedAt)
    : isNull(featureFlags.archivedAt);
  const searchFilter = options.search
    ? or(
        ilike(featureFlags.key, `%${options.search}%`),
        ilike(featureFlags.description, `%${options.search}%`),
      )
    : undefined;
  const flags = await db
    .select()
    .from(featureFlags)
    .where(searchFilter ? and(archivedFilter, searchFilter) : archivedFilter)
    .orderBy(asc(featureFlags.key));
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
      group = {
        key: flag.key,
        description: flag.description,
        archived: flag.archivedAt !== null,
        environments: {},
      };
      groups.set(flag.key, group);
    }
    group.environments[flag.environment as "dev" | "staging" | "prod"] = flag;
    if (flag.environment === "prod") {
      const approval = pending.find((a) => a.entityId === flag.id);
      if (approval) {
        const snapshot = (approval.ruleSnapshot ?? {}) as {
          state?: string;
          rolloutPercentage?: number | null;
        };
        group.pendingProdChange = {
          approvalId: approval.id,
          requestedBy: approval.requestedBy,
          proposedState: snapshot.state ?? "on",
          proposedRolloutPercentage: snapshot.rolloutPercentage ?? null,
        };
      }
    }
  }
  return [...groups.values()];
}
