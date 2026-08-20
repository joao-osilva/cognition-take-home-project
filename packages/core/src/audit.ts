import { platformSchema, type Db } from "@repo/db";

import type { Actor } from "./rbac";

export interface AuditEntry {
  action: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown>;
}

export async function writeAudit(db: Db, actor: Actor, entry: AuditEntry): Promise<void> {
  await db.insert(platformSchema.auditLog).values({
    actorId: actor.id,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    before: entry.before ?? null,
    after: entry.after ?? null,
    metadata: entry.metadata ?? null,
  });
}
