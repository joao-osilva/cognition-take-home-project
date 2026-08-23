import { platformSchema, type Db } from "@repo/db";
import { and, desc, eq, ilike, or, sql } from "@repo/db/orm";

import type { Actor } from "./rbac";

export interface AuditEntry {
  action: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown>;
}

export type AuditRow = typeof platformSchema.auditLog.$inferSelect & {
  actorName: string | null;
};

export interface AuditQuery {
  actorId?: string;
  entityType?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface AuditPage {
  rows: AuditRow[];
  total: number;
  entityTypes: string[];
  actors: { id: string; name: string }[];
}

export async function queryAuditLog(db: Db, query: AuditQuery = {}): Promise<AuditPage> {
  const pageSize = query.pageSize ?? 50;
  const page = Math.max(query.page ?? 1, 1);
  const { auditLog, users } = platformSchema;

  const conditions = [
    query.actorId ? eq(auditLog.actorId, query.actorId) : undefined,
    query.entityType ? eq(auditLog.entityType, query.entityType) : undefined,
    query.search
      ? or(
          ilike(auditLog.action, `%${query.search}%`),
          ilike(auditLog.entityId, `%${query.search}%`),
        )
      : undefined,
  ].filter((c) => c !== undefined);
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, totals, entityTypeRows, actorRows] = await Promise.all([
    db
      .select({
        id: auditLog.id,
        actorId: auditLog.actorId,
        action: auditLog.action,
        entityType: auditLog.entityType,
        entityId: auditLog.entityId,
        before: auditLog.before,
        after: auditLog.after,
        metadata: auditLog.metadata,
        createdAt: auditLog.createdAt,
        actorName: users.name,
      })
      .from(auditLog)
      .leftJoin(users, eq(auditLog.actorId, users.id))
      .where(where)
      .orderBy(desc(auditLog.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(auditLog)
      .where(where),
    db.selectDistinct({ entityType: auditLog.entityType }).from(auditLog),
    db
      .selectDistinct({ id: auditLog.actorId, name: users.name })
      .from(auditLog)
      .leftJoin(users, eq(auditLog.actorId, users.id)),
  ]);

  return {
    rows,
    total: totals[0]?.count ?? 0,
    entityTypes: entityTypeRows.map((r) => r.entityType).sort(),
    actors: actorRows
      .map((a) => ({ id: a.id, name: a.name ?? a.id }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
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
