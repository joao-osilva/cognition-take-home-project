import { coreSchema, platformSchema, type Db } from "@repo/db";
import { and, desc, eq, inArray, lt } from "@repo/db/orm";

import { kycCases, kycDocuments } from "./schema";

export type KycCase = typeof kycCases.$inferSelect;
export type KycDocument = typeof kycDocuments.$inferSelect;
export type AuditEntry = typeof platformSchema.auditLog.$inferSelect;

export interface KycCaseRow {
  kycCase: KycCase;
  customerName: string;
  customerEmail: string;
  customerRiskScore: number;
  assigneeName: string | null;
}

export interface KycCaseDetail extends KycCaseRow {
  documents: KycDocument[];
  auditTrail: AuditEntry[];
}

export async function listKycCases(
  db: Db,
  filters: { status?: string; riskLevel?: string } = {},
): Promise<KycCaseRow[]> {
  const rows = await db
    .select({
      kycCase: kycCases,
      customerName: coreSchema.customers.name,
      customerEmail: coreSchema.customers.email,
      customerRiskScore: coreSchema.customers.riskScore,
      assigneeName: platformSchema.users.name,
    })
    .from(kycCases)
    .innerJoin(coreSchema.customers, eq(kycCases.customerId, coreSchema.customers.id))
    .leftJoin(platformSchema.users, eq(kycCases.assigneeId, platformSchema.users.id))
    .orderBy(desc(kycCases.createdAt));

  return rows.filter(
    (r) =>
      (!filters.status || r.kycCase.status === filters.status) &&
      (!filters.riskLevel || r.kycCase.riskLevel === filters.riskLevel),
  );
}

export interface OverdueKycCase {
  id: string;
  customerName: string;
  assigneeId: string | null;
  slaDueAt: Date;
}

export async function listOverdueKycCases(db: Db, now = new Date()): Promise<OverdueKycCase[]> {
  const rows = await db
    .select({
      id: kycCases.id,
      customerName: coreSchema.customers.name,
      assigneeId: kycCases.assigneeId,
      slaDueAt: kycCases.slaDueAt,
    })
    .from(kycCases)
    .innerJoin(coreSchema.customers, eq(kycCases.customerId, coreSchema.customers.id))
    .where(and(inArray(kycCases.status, ["pending", "in_review"]), lt(kycCases.slaDueAt, now)));

  return rows.filter((r): r is OverdueKycCase => r.slaDueAt !== null);
}

export async function getKycCase(db: Db, caseId: string): Promise<KycCaseDetail | undefined> {
  const rows = await db
    .select({
      kycCase: kycCases,
      customerName: coreSchema.customers.name,
      customerEmail: coreSchema.customers.email,
      customerRiskScore: coreSchema.customers.riskScore,
      assigneeName: platformSchema.users.name,
    })
    .from(kycCases)
    .innerJoin(coreSchema.customers, eq(kycCases.customerId, coreSchema.customers.id))
    .leftJoin(platformSchema.users, eq(kycCases.assigneeId, platformSchema.users.id))
    .where(eq(kycCases.id, caseId))
    .limit(1);
  const row = rows[0];
  if (!row) return undefined;

  const documents = await db.select().from(kycDocuments).where(eq(kycDocuments.caseId, caseId));
  const auditTrail = await db
    .select()
    .from(platformSchema.auditLog)
    .where(eq(platformSchema.auditLog.entityId, caseId))
    .orderBy(desc(platformSchema.auditLog.createdAt));

  return { ...row, documents, auditTrail };
}
