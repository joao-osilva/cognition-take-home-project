import { definePolicy, hasRole } from "@repo/core";
import { eq } from "@repo/db/orm";

import { featureFlags } from "./schema";

// Production flag changes always require a second person; the proposed change
// travels in the approval's rule snapshot and is applied on approval.
export const flagApprovalPolicy = definePolicy({
  entityType: "feature_flag",
  needsApproval: (entity: typeof featureFlags.$inferSelect) => entity.environment === "prod",
  canDecide: (actor, _entity, requestedBy) =>
    hasRole(actor, "flags:approver") && actor.id !== requestedBy,
  onApproved: async (db, entity, ruleSnapshot) => {
    const snapshot = (ruleSnapshot ?? {}) as { state?: string; rolloutPercentage?: number | null };
    await db
      .update(featureFlags)
      .set({
        state: snapshot.state ?? entity.state,
        rolloutPercentage: snapshot.rolloutPercentage ?? null,
        updatedAt: new Date(),
      })
      .where(eq(featureFlags.id, entity.id));
  },
  onRejected: async () => {
    // Nothing to revert: the flag was never changed.
  },
  loadEntity: async (db, entityId) => {
    const rows = await db.select().from(featureFlags).where(eq(featureFlags.id, entityId)).limit(1);
    return rows[0];
  },
});
