import { platformSchema, type Db } from "@repo/db";

export interface Notification {
  recipientId: string;
  type: string;
  payload?: Record<string, unknown>;
}

export async function notify(db: Db, notification: Notification): Promise<void> {
  await db.insert(platformSchema.notifications).values({
    recipientId: notification.recipientId,
    type: notification.type,
    payload: notification.payload ?? null,
  });
}
