import { and, eq, isNull } from "@repo/db/orm";

import { platformSchema, type Db } from "@repo/db";

import { writeAudit } from "./audit";
import { ForbiddenError, type Actor } from "./rbac";

export interface ApprovableEntity {
  id: string;
}

export interface ApprovalPolicy<T extends ApprovableEntity> {
  entityType: string;
  needsApproval: (entity: T, config: ConfigReader) => Promise<boolean> | boolean;
  canDecide: (actor: Actor, entity: T, requestedBy: string) => boolean;
  onApproved: (db: Db, entity: T, ruleSnapshot: Record<string, unknown> | null) => Promise<void>;
  onRejected: (db: Db, entity: T, ruleSnapshot: Record<string, unknown> | null) => Promise<void>;
  loadEntity: (db: Db, entityId: string) => Promise<T | undefined>;
}

export interface ConfigReader {
  get<V>(key: string, fallback: V): Promise<V>;
}

export function definePolicy<T extends ApprovableEntity>(
  policy: ApprovalPolicy<T>,
): ApprovalPolicy<T> {
  return policy;
}

export async function requestApproval<T extends ApprovableEntity>(
  db: Db,
  policy: ApprovalPolicy<T>,
  entity: T,
  actor: Actor,
  ruleSnapshot?: Record<string, unknown>,
): Promise<string> {
  const rows = await db
    .insert(platformSchema.approvals)
    .values({
      entityType: policy.entityType,
      entityId: entity.id,
      requestedBy: actor.id,
      ruleSnapshot: ruleSnapshot ?? null,
    })
    .returning({ id: platformSchema.approvals.id });

  await writeAudit(db, actor, {
    action: "approval.requested",
    entityType: policy.entityType,
    entityId: entity.id,
    metadata: ruleSnapshot,
  });

  return rows[0]!.id;
}

export async function decideApproval<T extends ApprovableEntity>(
  db: Db,
  policy: ApprovalPolicy<T>,
  approvalId: string,
  actor: Actor,
  decision: "approved" | "rejected",
  reason: string,
): Promise<void> {
  const approvalRows = await db
    .select()
    .from(platformSchema.approvals)
    .where(eq(platformSchema.approvals.id, approvalId))
    .limit(1);
  const approval = approvalRows[0];
  if (!approval) throw new Error(`Approval ${approvalId} not found`);
  if (approval.decision) throw new Error(`Approval ${approvalId} already decided`);

  const entity = await policy.loadEntity(db, approval.entityId);
  if (!entity) throw new Error(`Entity ${approval.entityId} not found`);

  if (!policy.canDecide(actor, entity, approval.requestedBy)) {
    throw new ForbiddenError(`Actor ${actor.id} cannot decide this approval`);
  }

  await db
    .update(platformSchema.approvals)
    .set({ decidedBy: actor.id, decision, reason, decidedAt: new Date() })
    .where(eq(platformSchema.approvals.id, approvalId));

  const ruleSnapshot = (approval.ruleSnapshot ?? null) as Record<string, unknown> | null;
  if (decision === "approved") {
    await policy.onApproved(db, entity, ruleSnapshot);
  } else {
    await policy.onRejected(db, entity, ruleSnapshot);
  }

  await writeAudit(db, actor, {
    action: `approval.${decision}`,
    entityType: policy.entityType,
    entityId: approval.entityId,
    metadata: { reason },
  });
}

export type ApprovalRow = typeof platformSchema.approvals.$inferSelect;

export async function getPendingApproval(
  db: Db,
  entityType: string,
  entityId: string,
): Promise<ApprovalRow | undefined> {
  const rows = await db
    .select()
    .from(platformSchema.approvals)
    .where(
      and(
        eq(platformSchema.approvals.entityType, entityType),
        eq(platformSchema.approvals.entityId, entityId),
        isNull(platformSchema.approvals.decision),
      ),
    )
    .limit(1);
  return rows[0];
}
