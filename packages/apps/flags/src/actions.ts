import { z } from "zod";

import { decideApproval, defineAction, getPendingApproval, requestApproval } from "@repo/core";
import { and, eq, isNull } from "@repo/db/orm";

import { flagApprovalPolicy } from "./approval-policy";
import { featureFlags } from "./schema";

const ENVIRONMENTS = ["dev", "staging", "prod"] as const;

const flagStateInput = z
  .object({
    flagId: z.string().uuid(),
    state: z.enum(["on", "off", "percentage"]),
    rolloutPercentage: z.number().int().min(1).max(99).nullish(),
  })
  .refine((v) => v.state !== "percentage" || v.rolloutPercentage != null, {
    message: "A rollout percentage is required for percentage state",
  });

export const setFlagState = defineAction({
  role: "flags:operator",
  input: flagStateInput,
  audit: (input, result: { applied: boolean }) => ({
    action: result.applied ? "flags.changed" : "flags.change_requested",
    entityType: "feature_flag",
    entityId: input.flagId,
    after: {
      state: input.state,
      ...(input.state === "percentage" ? { rolloutPercentage: input.rolloutPercentage } : {}),
    },
  }),
  handler: async ({ db, actor }, input) => {
    const rows = await db
      .select()
      .from(featureFlags)
      .where(eq(featureFlags.id, input.flagId))
      .limit(1);
    const flag = rows[0];
    if (!flag) throw new Error("Flag not found");
    if (flag.archivedAt) throw new Error("This flag is archived");

    const rolloutPercentage =
      input.state === "percentage" ? (input.rolloutPercentage ?? null) : null;

    if (flag.environment === "prod") {
      const existing = await getPendingApproval(db, "feature_flag", flag.id);
      if (existing) throw new Error("A change for this prod flag is already pending approval");
      await requestApproval(db, flagApprovalPolicy, flag, actor, {
        state: input.state,
        rolloutPercentage,
      });
      return { applied: false };
    }

    await db
      .update(featureFlags)
      .set({ state: input.state, rolloutPercentage, updatedAt: new Date() })
      .where(eq(featureFlags.id, input.flagId));
    return { applied: true };
  },
});

export const createFlag = defineAction({
  role: "flags:operator",
  input: z.object({
    key: z
      .string()
      .min(2)
      .max(64)
      .regex(/^[a-z][a-z0-9._-]*$/, "Use lowercase letters, digits, dots, dashes or underscores"),
    description: z.string().min(3).max(200),
  }),
  audit: (input) => ({
    action: "flags.created",
    entityType: "feature_flag",
    entityId: input.key,
    after: { key: input.key, description: input.description },
  }),
  handler: async ({ db, actor }, input) => {
    const existing = await db
      .select({ id: featureFlags.id })
      .from(featureFlags)
      .where(eq(featureFlags.key, input.key))
      .limit(1);
    if (existing.length > 0) throw new Error(`A flag with key "${input.key}" already exists`);

    await db.insert(featureFlags).values(
      ENVIRONMENTS.map((environment) => ({
        key: input.key,
        description: input.description,
        environment,
        state: "off",
        ownerId: actor.id,
      })),
    );
    return { key: input.key };
  },
});

export const archiveFlag = defineAction({
  role: "flags:operator",
  input: z.object({ key: z.string().min(1) }),
  audit: (input) => ({
    action: "flags.archived",
    entityType: "feature_flag",
    entityId: input.key,
  }),
  handler: async ({ db }, input) => {
    const rows = await db
      .select()
      .from(featureFlags)
      .where(and(eq(featureFlags.key, input.key), isNull(featureFlags.archivedAt)));
    if (rows.length === 0) throw new Error("Flag not found or already archived");

    const prod = rows.find((f) => f.environment === "prod");
    if (prod) {
      if (prod.state !== "off") {
        throw new Error("Turn the flag off in prod (via approval) before archiving");
      }
      const pending = await getPendingApproval(db, "feature_flag", prod.id);
      if (pending) throw new Error("Resolve the pending prod change before archiving");
    }

    await db
      .update(featureFlags)
      .set({ archivedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(featureFlags.key, input.key), isNull(featureFlags.archivedAt)));
    return { key: input.key };
  },
});

export const restoreFlag = defineAction({
  role: "flags:operator",
  input: z.object({ key: z.string().min(1) }),
  audit: (input) => ({
    action: "flags.restored",
    entityType: "feature_flag",
    entityId: input.key,
  }),
  handler: async ({ db }, input) => {
    const rows = await db
      .select({ id: featureFlags.id })
      .from(featureFlags)
      .where(eq(featureFlags.key, input.key));
    if (rows.length === 0) throw new Error("Flag not found");

    await db
      .update(featureFlags)
      .set({ archivedAt: null, updatedAt: new Date() })
      .where(eq(featureFlags.key, input.key));
    return { key: input.key };
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
