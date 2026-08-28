import { coreSchema, platformSchema, type Db } from "@repo/db";
import { desc, eq, ilike, isNull, and, or, sql } from "@repo/db/orm";

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

export interface RefundFilters {
  status?: string;
  requestedBy?: string;
}

export interface RefundRequester {
  id: string;
  name: string | null;
}

export async function listRefunds(db: Db, filters: RefundFilters = {}): Promise<RefundRow[]> {
  const conditions = [
    filters.status ? eq(refundRequests.status, filters.status) : undefined,
    filters.requestedBy ? eq(refundRequests.requestedBy, filters.requestedBy) : undefined,
  ].filter((c) => c !== undefined);

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
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(refundRequests.createdAt));
  return rows;
}

export async function listRefundRequesters(db: Db): Promise<RefundRequester[]> {
  const rows = await db
    .selectDistinct({
      id: refundRequests.requestedBy,
      name: platformSchema.users.name,
    })
    .from(refundRequests)
    .leftJoin(platformSchema.users, eq(refundRequests.requestedBy, platformSchema.users.id));
  return rows.sort((a, b) => (a.name ?? a.id).localeCompare(b.name ?? b.id));
}

export interface RefundAuditEntry {
  id: string;
  actorId: string;
  actorName: string | null;
  action: string;
  createdAt: Date;
  metadata: unknown;
}

export interface RefundDetail extends RefundRow {
  auditTrail: RefundAuditEntry[];
}

export async function getRefundDetail(db: Db, refundId: string): Promise<RefundDetail | undefined> {
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
    .where(eq(refundRequests.id, refundId))
    .limit(1);
  const row = rows[0];
  if (!row) return undefined;

  const auditTrail = await db
    .select({
      id: platformSchema.auditLog.id,
      actorId: platformSchema.auditLog.actorId,
      actorName: platformSchema.users.name,
      action: platformSchema.auditLog.action,
      createdAt: platformSchema.auditLog.createdAt,
      metadata: platformSchema.auditLog.metadata,
    })
    .from(platformSchema.auditLog)
    .leftJoin(platformSchema.users, eq(platformSchema.auditLog.actorId, platformSchema.users.id))
    .where(
      or(
        eq(platformSchema.auditLog.entityId, refundId),
        sql`${platformSchema.auditLog.metadata} ->> 'refundId' = ${refundId}`,
      ),
    )
    .orderBy(desc(platformSchema.auditLog.createdAt));

  return { ...row, auditTrail };
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

/** System-side settlement: moves an approved refund to `processed`. Called by
 * the background settlement job, not by user actions. Returns the settled row,
 * or undefined when the refund is missing or not in `approved`. */
export async function settleRefund(db: Db, refundId: string): Promise<RefundRequest | undefined> {
  const rows = await db
    .update(refundRequests)
    .set({ status: "processed", updatedAt: new Date() })
    .where(and(eq(refundRequests.id, refundId), eq(refundRequests.status, "approved")))
    .returning();
  return rows[0];
}

/** Search settled transactions by customer name or transaction id prefix.
 * Capped so the picker never ships the full transaction set to the client. */
export async function searchRefundableTransactions(
  db: Db,
  query: string,
  limit = 20,
): Promise<RefundableTransaction[]> {
  const term = query.trim();
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
    .where(
      and(
        eq(coreSchema.transactions.status, "settled"),
        term
          ? or(
              ilike(coreSchema.customers.name, `%${term}%`),
              ilike(sql`${coreSchema.transactions.id}::text`, `${term}%`),
            )
          : undefined,
      ),
    )
    .orderBy(desc(coreSchema.transactions.createdAt))
    .limit(limit);
}
