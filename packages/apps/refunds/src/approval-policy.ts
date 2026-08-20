import { definePolicy, hasRole } from "@repo/core";
import { eq } from "@repo/db/orm";

import { refundRequests } from "./schema";

export const refundApprovalPolicy = definePolicy({
  entityType: "refund_request",
  needsApproval: async (entity: typeof refundRequests.$inferSelect, config) => {
    const threshold = await config.get("refunds.approval_threshold", 100000);
    return entity.amount >= threshold;
  },
  // Maker-checker: an approver may never decide their own request.
  canDecide: (actor, _entity, requestedBy) =>
    hasRole(actor, "refunds:approver") && actor.id !== requestedBy,
  onApproved: async (db, entity) => {
    await db
      .update(refundRequests)
      .set({ status: "approved", updatedAt: new Date() })
      .where(eq(refundRequests.id, entity.id));
  },
  onRejected: async (db, entity) => {
    await db
      .update(refundRequests)
      .set({ status: "rejected", updatedAt: new Date() })
      .where(eq(refundRequests.id, entity.id));
  },
  loadEntity: async (db, entityId) => {
    const rows = await db
      .select()
      .from(refundRequests)
      .where(eq(refundRequests.id, entityId))
      .limit(1);
    return rows[0];
  },
});
