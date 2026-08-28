import { definePolicy, hasRole } from "@repo/core";
import { eq } from "@repo/db/orm";

import { refundRequests } from "./schema";

export const refundApprovalPolicy = definePolicy({
  entityType: "refund_request",
  // Every refund requires a second-person approval, regardless of amount.
  needsApproval: async (_entity: typeof refundRequests.$inferSelect, _config) => true,
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
