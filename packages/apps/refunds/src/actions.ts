import { z } from "zod";

import { decideApproval, defineAction, getConfig, notify, requestApproval } from "@repo/core";
import { coreSchema, platformSchema } from "@repo/db";
import { eq } from "@repo/db/orm";

import { refundApprovalPolicy } from "./approval-policy";
import { refundRequests } from "./schema";

export const requestRefund = defineAction({
  role: "refunds:operator",
  input: z.object({
    transactionId: z.string().uuid(),
    amount: z.number().int().positive(),
    reason: z.string().min(3),
  }),
  audit: (input, result: { refundId: string; status: string }) => ({
    action: "refunds.requested",
    entityType: "refund_request",
    entityId: result.refundId,
    after: { amount: input.amount, reason: input.reason, status: result.status },
  }),
  handler: async ({ db, actor }, input) => {
    const txRows = await db
      .select()
      .from(coreSchema.transactions)
      .where(eq(coreSchema.transactions.id, input.transactionId))
      .limit(1);
    const transaction = txRows[0];
    if (!transaction) throw new Error("Transaction not found");
    if (input.amount > transaction.amount) {
      throw new Error("Refund amount exceeds the transaction amount");
    }

    const rows = await db
      .insert(refundRequests)
      .values({
        transactionId: input.transactionId,
        amount: input.amount,
        currency: transaction.currency,
        reason: input.reason,
        requestedBy: actor.id,
      })
      .returning();
    const refund = rows[0];
    if (!refund) throw new Error("Failed to create refund request");

    const config = {
      get: <V>(key: string, fallback: V) => getConfig(db, key, fallback),
    };
    if (await refundApprovalPolicy.needsApproval(refund, config)) {
      const threshold = await config.get("refunds.approval_threshold", 100000);
      await db
        .update(refundRequests)
        .set({ status: "pending_approval", updatedAt: new Date() })
        .where(eq(refundRequests.id, refund.id));
      await requestApproval(db, refundApprovalPolicy, refund, actor, {
        threshold,
        amount: refund.amount,
      });
      return { refundId: refund.id, status: "pending_approval" };
    }

    // Below the threshold: auto-approved and handed to processing.
    await db
      .update(refundRequests)
      .set({ status: "approved", updatedAt: new Date() })
      .where(eq(refundRequests.id, refund.id));
    return { refundId: refund.id, status: "approved" };
  },
});

export const decideRefund = defineAction({
  role: "refunds:approver",
  input: z.object({
    approvalId: z.string().uuid(),
    decision: z.enum(["approved", "rejected"]),
    reason: z.string().min(3),
  }),
  audit: (input, result: { refundId: string; requestedBy: string }) => ({
    action: `refunds.${input.decision}`,
    entityType: "refund_request",
    entityId: result.refundId,
    metadata: { reason: input.reason },
  }),
  handler: async ({ db, actor }, input) => {
    const approvalRows = await db
      .select()
      .from(platformSchema.approvals)
      .where(eq(platformSchema.approvals.id, input.approvalId))
      .limit(1);
    const approval = approvalRows[0];
    if (!approval) throw new Error("Approval not found");

    await decideApproval(
      db,
      refundApprovalPolicy,
      input.approvalId,
      actor,
      input.decision,
      input.reason,
    );
    await notify(db, {
      recipientId: approval.requestedBy,
      type: `refund.${input.decision}`,
      payload: { refundId: approval.entityId, reason: input.reason },
    });
    return { refundId: approval.entityId, requestedBy: approval.requestedBy };
  },
});
