import { countUnreadNotifications, listNotifications, type NotificationRow } from "@repo/core";

import type { NotificationItem } from "@/components/notification-bell";
import { getDb } from "@/lib/db";

const TYPE_LABELS: Record<string, string> = {
  "kyc.sla_overdue": "KYC SLA overdue",
  "kyc.case.decided": "KYC case decided",
  "kyc.case.escalated": "KYC case escalated",
  "refund.approved": "Refund approved",
  "refund.rejected": "Refund rejected",
  "refund.settled": "Refund settled",
  "approval.pending_reminder": "Approval reminder",
  "ops.daily_digest": "Daily digest",
};

/** Human-readable label for a notification type key (e.g. "kyc.sla_overdue" → "KYC SLA overdue"). */
export function notificationTypeLabel(type: string): string {
  const known = TYPE_LABELS[type];
  if (known) return known;
  const words = type.replace(/[._]/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function formatMessage(n: NotificationRow): string {
  const payload = (n.payload ?? {}) as Record<string, unknown>;
  const customer = String(payload["customerName"] ?? "a customer");
  switch (n.type) {
    case "kyc.sla_overdue":
      return `KYC case for ${customer} is past its SLA`;
    case "kyc.case.decided":
      return `KYC case for ${customer} was ${String(payload["decision"] ?? "decided")}`;
    case "kyc.case.escalated":
      return `KYC case for ${customer} was escalated and needs an approver decision`;
    case "refund.approved":
      return "Your refund request was approved";
    case "refund.rejected":
      return "Your refund request was rejected";
    case "refund.settled":
      return "Your approved refund was settled";
    case "approval.pending_reminder":
      return `A ${String(payload["entityType"] ?? "request").replace(/_/g, " ")} approval is still waiting for a decision`;
    case "ops.daily_digest":
      return `Daily digest: ${String(payload["overdueKyc"] ?? 0)} overdue KYC case(s), ${String(payload["pendingApprovals"] ?? 0)} pending approval(s)`;
    default:
      return notificationTypeLabel(n.type);
  }
}

/** Where clicking a notification should take the user. */
export function notificationHref(n: NotificationRow): string | null {
  const payload = (n.payload ?? {}) as Record<string, unknown>;
  const caseId = payload["caseId"];
  switch (n.type) {
    case "kyc.sla_overdue":
    case "kyc.case.decided":
    case "kyc.case.escalated":
      return typeof caseId === "string" ? `/kyc/${caseId}` : "/kyc";
    case "refund.approved":
    case "refund.rejected":
    case "refund.settled":
      return "/refunds";
    case "approval.pending_reminder":
      return payload["entityType"] === "feature_flag" ? "/flags" : "/refunds";
    default:
      return null;
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
