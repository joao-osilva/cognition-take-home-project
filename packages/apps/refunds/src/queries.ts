import { coreSchema, platformSchema, type Db } from "@repo/db";
import { desc, eq, isNull, and, sql } from "@repo/db/orm";

import { refundRequests } from "./schema";

export type RefundRequest = typeof refundRequests.$inferSelect;

export interface RefundRow {
  refund: RefundRequest;
  customerName: string;
  requesterName: string | null;
  approvalId: string | null;
}

export interface RefundMetrics {
  pendingCount: number;
  pendingAmount: number;
  approvedCount: number;
  rejectedCount: number;
}

export interface RefundableTransaction {
  id: string;
  amount: number;
  currency: string;
  customerName: string;
}

export async function listRefunds(db: Db): Promise<RefundRow[]> {
  const rows = await db
    .select({
      refund: refundRequests,
      customerName: coreSchema.customers.name,
      requesterName: platformSchema.users.name,
      approvalId: platformSchema.approvals.id,
    })
    .from(refundRequests)
    .innerJoin(
      coreSchema.transactions,
      eq(refundRequests.transactionId, coreSchema.transactions.id),
    )
    .innerJoin(
      coreSchema.customers,
      eq(coreSchema.transactions.customerId, coreSchema.customers.id),
    )
    .leftJoin(platformSchema.users, eq(refundRequests.requestedBy, platformSchema.users.id))
    .leftJoin(
      platformSchema.approvals,
      and(
        eq(platformSchema.approvals.entityType, "refund_request"),
        eq(platformSchema.approvals.entityId, sql`${refundRequests.id}::text`),
        isNull(platformSchema.approvals.decision),
      ),
    )
    .orderBy(desc(refundRequests.createdAt));
  return rows;
}

export function computeMetrics(rows: RefundRow[]): RefundMetrics {
  const pending = rows.filter((r) => ["requested", "pending_approval"].includes(r.refund.status));
  return {
    pendingCount: pending.length,
    pendingAmount: pending.reduce((sum, r) => sum + r.refund.amount, 0),
    approvedCount: rows.filter((r) => ["approved", "processed"].includes(r.refund.status)).length,
    rejectedCount: rows.filter((r) => r.refund.status === "rejected").length,
  };
}

export async function listRefundableTransactions(db: Db): Promise<RefundableTransaction[]> {
  return db
    .select({
      id: coreSchema.transactions.id,
      amount: coreSchema.transactions.amount,
      currency: coreSchema.transactions.currency,
      customerName: coreSchema.customers.name,
    })
    .from(coreSchema.transactions)
    .innerJoin(
      coreSchema.customers,
      eq(coreSchema.transactions.customerId, coreSchema.customers.id),
    )
    .where(eq(coreSchema.transactions.status, "settled"))
    .orderBy(desc(coreSchema.transactions.createdAt));
}
