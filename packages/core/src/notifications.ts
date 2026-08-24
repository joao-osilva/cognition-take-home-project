import { and, desc, eq, inArray, isNull, sql } from "@repo/db/orm";

import { platformSchema, type Db } from "@repo/db";

export interface Notification {
  recipientId: string;
  type: string;
  payload?: Record<string, unknown>;
}

export type NotificationRow = typeof platformSchema.notifications.$inferSelect;

export async function notify(db: Db, notification: Notification): Promise<void> {
  await db.insert(platformSchema.notifications).values({
    recipientId: notification.recipientId,
    type: notification.type,
    payload: notification.payload ?? null,
  });
}

export async function listNotifications(
  db: Db,
  recipientId: string,
  limit = 20,
): Promise<NotificationRow[]> {
  return db
    .select()
    .from(platformSchema.notifications)
    .where(eq(platformSchema.notifications.recipientId, recipientId))
    .orderBy(desc(platformSchema.notifications.createdAt))
    .limit(limit);
}

export async function countUnreadNotifications(db: Db, recipientId: string): Promise<number> {
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(platformSchema.notifications)
    .where(
      and(
        eq(platformSchema.notifications.recipientId, recipientId),
        isNull(platformSchema.notifications.readAt),
      ),
    );
  return rows[0]?.count ?? 0;
}

/** Marks the recipient's notifications read; scoped to recipientId so a user
 * can never mark someone else's. */
export async function markNotificationsRead(
  db: Db,
  recipientId: string,
  ids?: string[],
): Promise<void> {
  const conditions = [
    eq(platformSchema.notifications.recipientId, recipientId),
    isNull(platformSchema.notifications.readAt),
  ];
  if (ids && ids.length > 0) conditions.push(inArray(platformSchema.notifications.id, ids));
  await db
    .update(platformSchema.notifications)
    .set({ readAt: new Date() })
    .where(and(...conditions));
}

export interface NotificationQuery {
  unreadOnly?: boolean;
  type?: string;
  page?: number;
  pageSize?: number;
}

export interface NotificationPage {
  rows: NotificationRow[];
  total: number;
  types: string[];
}

export async function queryNotifications(
  db: Db,
  recipientId: string,
  query: NotificationQuery = {},
): Promise<NotificationPage> {
  const pageSize = query.pageSize ?? 25;
  const page = Math.max(query.page ?? 1, 1);
  const { notifications } = platformSchema;

  const conditions = [
    eq(notifications.recipientId, recipientId),
    query.unreadOnly ? isNull(notifications.readAt) : undefined,
    query.type ? eq(notifications.type, query.type) : undefined,
  ].filter((c) => c !== undefined);
  const where = and(...conditions);

  const [rows, totals, typeRows] = await Promise.all([
    db
      .select()
      .from(notifications)
      .where(where)
      .orderBy(desc(notifications.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(where),
    db
      .selectDistinct({ type: notifications.type })
      .from(notifications)
      .where(eq(notifications.recipientId, recipientId)),
  ]);

  return {
    rows,
    total: totals[0]?.count ?? 0,
    types: typeRows.map((r) => r.type).sort(),
  };
}

/** Whether a notification of this type with a payload containing `payloadMatch`
 * already exists — used by background jobs to stay idempotent. */
export async function hasNotification(
  db: Db,
  type: string,
  payloadMatch: Record<string, unknown>,
): Promise<boolean> {
  const rows = await db
    .select({ id: platformSchema.notifications.id })
    .from(platformSchema.notifications)
    .where(
      and(
        eq(platformSchema.notifications.type, type),
        sql`${platformSchema.notifications.payload} @> ${JSON.stringify(payloadMatch)}::jsonb`,
      ),
    )
    .limit(1);
  return rows.length > 0;
}
