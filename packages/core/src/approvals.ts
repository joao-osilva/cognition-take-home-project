import { eq } from "drizzle-orm";

import { platformSchema, type Db } from "@repo/db";

import { writeAudit } from "./audit";
import { ForbiddenError, type Actor } from "./rbac";

export interface ApprovableEntity {
  id: string;
}

export interface ApprovalPolicy<T extends ApprovableEntity> {
  entityType: string;
  needsApproval: (entity: T, config: ConfigReader) => Promise<boolean> | boolean;
  canDecide: (actor: Actor, entity: T) => boolean;
  onApproved: (db: Db, entity: T) => Promise<void>;
  onRejected: (db: Db, entity: T) => Promise<void>;
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

  if (!policy.canDecide(actor, entity)) {
    throw new ForbiddenError(`Actor ${actor.id} cannot decide this approval`);
  }

  await db
    .update(platformSchema.approvals)
    .set({ decidedBy: actor.id, decision, reason, decidedAt: new Date() })
    .where(eq(platformSchema.approvals.id, approvalId));

  if (decision === "approved") {
    await policy.onApproved(db, entity);
  } else {
    await policy.onRejected(db, entity);
  }

  await writeAudit(db, actor, {
    action: `approval.${decision}`,
    entityType: policy.entityType,
    entityId: approval.entityId,
    metadata: { reason },
  });
}
