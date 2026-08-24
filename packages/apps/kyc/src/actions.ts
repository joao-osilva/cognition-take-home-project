import { z } from "zod";

import { defineAction, getConfig, requireRole, ForbiddenError } from "@repo/core";
import { eq } from "@repo/db/orm";
import { customers } from "@repo/db/schema/core";

import { kycCases, kycDocuments } from "./schema";

export const createCase = defineAction({
  role: "kyc:operator",
  input: z.object({
    customerName: z.string().min(2).max(120),
    customerEmail: z.string().email(),
    riskLevel: z.enum(["low", "medium", "high"]),
  }),
  audit: (input, result: { caseId: string }) => ({
    action: "kyc.case.created",
    entityType: "kyc_case",
    entityId: result.caseId,
    metadata: { customerEmail: input.customerEmail, riskLevel: input.riskLevel },
  }),
  handler: async ({ db }, input) => {
    const existing = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.email, input.customerEmail))
      .limit(1);
    let customerId = existing[0]?.id;
    if (!customerId) {
      const inserted = await db
        .insert(customers)
        .values({ name: input.customerName, email: input.customerEmail })
        .returning({ id: customers.id });
      customerId = inserted[0]?.id;
      if (!customerId) throw new Error("Failed to create customer");
    }
    const slaHours = await getConfig(db, "kyc.sla_hours", 48);
    const rows = await db
      .insert(kycCases)
      .values({
        customerId,
        riskLevel: input.riskLevel,
        slaDueAt: new Date(Date.now() + slaHours * 3_600_000),
      })
      .returning({ id: kycCases.id });
    const row = rows[0];
    if (!row) throw new Error("Failed to create case");
    return { caseId: row.id };
  },
});

export const claimCase = defineAction({
  role: "kyc:operator",
  input: z.object({ caseId: z.string().uuid() }),
  audit: (input) => ({
    action: "kyc.case.claimed",
    entityType: "kyc_case",
    entityId: input.caseId,
  }),
  handler: async ({ db, actor }, input) => {
    const rows = await db.select().from(kycCases).where(eq(kycCases.id, input.caseId)).limit(1);
    const kycCase = rows[0];
    if (!kycCase) throw new Error("Case not found");
    if (kycCase.status !== "pending") throw new Error("Only pending cases can be claimed");
    await db
      .update(kycCases)
      .set({ status: "in_review", assigneeId: actor.id, updatedAt: new Date() })
      .where(eq(kycCases.id, input.caseId));
    return { caseId: input.caseId };
  },
});

export const uploadDocument = defineAction({
  role: "kyc:operator",
  input: z.object({
    caseId: z.string().uuid(),
    type: z.enum(["passport", "proof_of_address", "selfie", "other"]),
    blobUrl: z.string().min(1),
  }),
  audit: (input, result: { documentId: string; caseId: string }) => ({
    action: "kyc.document.uploaded",
    entityType: "kyc_document",
    entityId: result.documentId,
    metadata: { caseId: input.caseId, type: input.type },
  }),
  handler: async ({ db }, input) => {
    const rows = await db.select().from(kycCases).where(eq(kycCases.id, input.caseId)).limit(1);
    const kycCase = rows[0];
    if (!kycCase) throw new Error("Case not found");
    if (kycCase.status === "approved" || kycCase.status === "rejected") {
      throw new Error("Documents can only be added to open cases");
    }
    const inserted = await db
      .insert(kycDocuments)
      .values({ caseId: input.caseId, type: input.type, blobUrl: input.blobUrl })
      .returning({ id: kycDocuments.id });
    const doc = inserted[0];
    if (!doc) throw new Error("Failed to record document");
    return { documentId: doc.id, caseId: input.caseId };
  },
});

export const decideCase = defineAction({
  role: "kyc:operator",
  input: z.object({
    caseId: z.string().uuid(),
    decision: z.enum(["approved", "rejected"]),
    reason: z.string().min(3),
  }),
  audit: (input) => ({
    action: `kyc.case.${input.decision}`,
    entityType: "kyc_case",
    entityId: input.caseId,
    metadata: { reason: input.reason },
  }),
  handler: async ({ db, actor }, input) => {
    const rows = await db.select().from(kycCases).where(eq(kycCases.id, input.caseId)).limit(1);
    const kycCase = rows[0];
    if (!kycCase) throw new Error("Case not found");
    if (kycCase.status !== "in_review" && kycCase.status !== "escalated") {
      throw new Error("Case is not open for a decision");
    }
    if (kycCase.status === "escalated") {
      // Escalated cases need the approver tier, and separation of duties:
      // the deciding approver must differ from the analyst who escalated.
      requireRole(actor, "kyc:approver");
      if (kycCase.assigneeId === actor.id) {
        throw new ForbiddenError("Escalated cases must be decided by someone else");
      }
    }
    await db
      .update(kycCases)
      .set({ status: input.decision, decisionReason: input.reason, updatedAt: new Date() })
      .where(eq(kycCases.id, input.caseId));
    return { caseId: input.caseId };
  },
});

export const escalateCase = defineAction({
  role: "kyc:operator",
  input: z.object({ caseId: z.string().uuid(), reason: z.string().min(3) }),
  audit: (input) => ({
    action: "kyc.case.escalated",
    entityType: "kyc_case",
    entityId: input.caseId,
    metadata: { reason: input.reason },
  }),
  handler: async ({ db }, input) => {
    const rows = await db.select().from(kycCases).where(eq(kycCases.id, input.caseId)).limit(1);
    const kycCase = rows[0];
    if (!kycCase) throw new Error("Case not found");
    if (kycCase.status !== "in_review") throw new Error("Only in-review cases can be escalated");
    await db
      .update(kycCases)
      .set({ status: "escalated", decisionReason: input.reason, updatedAt: new Date() })
      .where(eq(kycCases.id, input.caseId));
    return { caseId: input.caseId };
  },
});
