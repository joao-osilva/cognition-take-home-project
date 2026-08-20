import { z } from "zod";

import { defineAction, requireRole, ForbiddenError } from "@repo/core";
import { eq } from "@repo/db/orm";

import { kycCases } from "./schema";

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
