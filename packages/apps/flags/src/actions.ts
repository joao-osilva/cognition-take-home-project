import { z } from "zod";

import { decideApproval, defineAction, getPendingApproval, requestApproval } from "@repo/core";
import { eq } from "@repo/db/orm";

import { flagApprovalPolicy } from "./approval-policy";
import { featureFlags } from "./schema";

export const setFlagState = defineAction({
  role: "flags:operator",
  input: z.object({
    flagId: z.string().uuid(),
    state: z.enum(["on", "off"]),
  }),
  audit: (input, result: { applied: boolean }) => ({
    action: result.applied ? "flags.changed" : "flags.change_requested",
    entityType: "feature_flag",
    entityId: input.flagId,
    after: { state: input.state },
  }),
  handler: async ({ db, actor }, input) => {
    const rows = await db
      .select()
      .from(featureFlags)
      .where(eq(featureFlags.id, input.flagId))
      .limit(1);
    const flag = rows[0];
    if (!flag) throw new Error("Flag not found");

    if (flag.environment === "prod") {
      const existing = await getPendingApproval(db, "feature_flag", flag.id);
      if (existing) throw new Error("A change for this prod flag is already pending approval");
      await requestApproval(db, flagApprovalPolicy, flag, actor, {
        state: input.state,
        rolloutPercentage: null,
      });
      return { applied: false };
    }

    await db
      .update(featureFlags)
      .set({ state: input.state, rolloutPercentage: null, updatedAt: new Date() })
      .where(eq(featureFlags.id, input.flagId));
    return { applied: true };
  },
});

export const decideFlagChange = defineAction({
  role: "flags:approver",
  input: z.object({
    approvalId: z.string().uuid(),
    decision: z.enum(["approved", "rejected"]),
    reason: z.string().min(3),
  }),
  audit: (input) => ({
    action: `flags.change_${input.decision}`,
    entityType: "feature_flag_approval",
    entityId: input.approvalId,
    metadata: { reason: input.reason },
  }),
  handler: async ({ db, actor }, input) => {
    await decideApproval(
      db,
      flagApprovalPolicy,
      input.approvalId,
      actor,
      input.decision,
      input.reason,
    );
    return { approvalId: input.approvalId };
  },
});
