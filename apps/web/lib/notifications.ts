import { countUnreadNotifications, listNotifications, type NotificationRow } from "@repo/core";

import type { NotificationItem } from "@/components/notification-bell";
import { getDb } from "@/lib/db";

function formatMessage(n: NotificationRow): string {
  const payload = (n.payload ?? {}) as Record<string, unknown>;
  switch (n.type) {
    case "kyc.sla_overdue":
      return `KYC case for ${String(payload["customerName"] ?? "a customer")} is past its SLA`;
    case "refund.approved":
      return "Your refund request was approved";
    case "refund.rejected":
      return "Your refund request was rejected";
    default:
      return n.type;
  }
}

export async function getNotificationsForUser(
  userId: string,
): Promise<{ items: NotificationItem[]; unreadCount: number }> {
  const db = getDb();
  const [rows, unreadCount] = await Promise.all([
    listNotifications(db, userId),
    countUnreadNotifications(db, userId),
  ]);

  const items = rows.map((n) => ({
    id: n.id,
    type: n.type,
    message: formatMessage(n),
    read: n.readAt !== null,
    createdAt: n.createdAt.toLocaleString("en-US"),
  }));

  return { items, unreadCount };
}
