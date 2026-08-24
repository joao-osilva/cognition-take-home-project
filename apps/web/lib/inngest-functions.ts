import { z } from "zod";

import {
  getConfig,
  hasNotification,
  listStalePendingApprovals,
  notify,
  writeAudit,
  type Actor,
  type Role,
} from "@repo/core";
import { getKycCase, listOverdueKycCases } from "@repo/app-kyc";
import { settleRefund } from "@repo/app-refunds";

import { listClerkUsers } from "@/lib/admin";
import { getDb } from "@/lib/db";
import { inngest } from "@/lib/inngest";

const OVERDUE_TYPE = "kyc.sla_overdue";

// Actor recorded on audit rows written by background jobs.
const SYSTEM_ACTOR: Actor = { id: "system", roles: ["admin"] };

async function listUsersWithRole(role: Role): Promise<string[]> {
  const users = await listClerkUsers();
  return users
    .filter((u) => u.roles.some((r) => r === role || r === "admin"))
    .map((u) => u.actorId);
}

/**
 * Hourly sweep for KYC cases past their SLA. Notifies the assignee, or every
 * kyc:approver/admin when the case is unassigned. `hasNotification` keys on
 * caseId, so each case produces at most one reminder per recipient set.
 */
export const kycSlaReminder = inngest.createFunction(
  { id: "kyc-sla-reminder", triggers: { cron: "0 * * * *" } },
  async ({ step }) => {
    const db = getDb();

    const overdue = await step.run("find-overdue-cases", () => listOverdueKycCases(db));
    if (overdue.length === 0) return { notified: 0 };

    const approverIds = await step.run("list-approvers", () => listUsersWithRole("kyc:approver"));

    const notified = await step.run("send-notifications", async () => {
      let count = 0;
      for (const kycCase of overdue) {
        const payload = {
          caseId: kycCase.id,
          customerName: kycCase.customerName,
          slaDueAt: kycCase.slaDueAt,
        };
        if (await hasNotification(db, OVERDUE_TYPE, { caseId: kycCase.id })) continue;

        const recipients = kycCase.assigneeId ? [kycCase.assigneeId] : approverIds;
        for (const recipientId of recipients) {
          await notify(db, { recipientId, type: OVERDUE_TYPE, payload });
          count += 1;
        }
      }
      return count;
    });

    return { overdue: overdue.length, notified };
  },
);

const refundApprovedEvent = z.object({ refundId: z.string().uuid(), requestedBy: z.string() });

/**
 * Post-approval settlement leg: waits out a simulated processing window, moves
 * the refund to `processed`, and tells the requester. Retried by Inngest on
 * failure; `settleRefund` only transitions approved -> processed, so replays
 * are no-ops.
 */
export const refundSettlement = inngest.createFunction(
  { id: "refund-settlement", triggers: { event: "refund.approved" } },
  async ({ event, step }) => {
    const db = getDb();
    const { refundId, requestedBy } = refundApprovedEvent.parse(event.data);

    await step.sleep("simulate-processing", "30s");

    const refund = await step.run("settle", () => settleRefund(db, refundId));
    if (!refund) return { settled: false };

    await step.run("notify-and-audit", async () => {
      await notify(db, {
        recipientId: requestedBy,
        type: "refund.settled",
        payload: { refundId, amount: refund.amount, currency: refund.currency },
      });
      await writeAudit(db, SYSTEM_ACTOR, {
        action: "refunds.settled",
        entityType: "refund_request",
        entityId: refundId,
        after: { status: "processed" },
      });
    });

    return { settled: true };
  },
);

// Which approver tier can act on each approval entity type.
const APPROVER_ROLE_BY_ENTITY: Record<string, Role> = {
  refund_request: "refunds:approver",
  feature_flag: "flags:approver",
};

/**
 * Hourly nudge for maker-checker requests that have sat undecided longer than
 * `approvals.reminder_hours`. Each approval reminds its approver group once
 * (deduped on approvalId); the requester is excluded per separation of duties.
 */
export const approvalPendingReminder = inngest.createFunction(
  { id: "approval-pending-reminder", triggers: { cron: "30 * * * *" } },
  async ({ step }) => {
    const db = getDb();

    const stale = await step.run("find-stale-approvals", async () => {
      const hours = await getConfig(db, "approvals.reminder_hours", 4);
      const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
      return listStalePendingApprovals(db, cutoff);
    });
    if (stale.length === 0) return { notified: 0 };

    const users = await step.run("list-users", () => listClerkUsers());

    const notified = await step.run("send-notifications", async () => {
      let count = 0;
      for (const approval of stale) {
        const role = APPROVER_ROLE_BY_ENTITY[approval.entityType];
        if (!role) continue;
        if (await hasNotification(db, "approval.pending_reminder", { approvalId: approval.id })) {
          continue;
        }
        const recipients = users
          .filter((u) => u.roles.some((r) => r === role || r === "admin"))
          .map((u) => u.actorId)
          .filter((id) => id !== approval.requestedBy);
        for (const recipientId of recipients) {
          await notify(db, {
            recipientId,
            type: "approval.pending_reminder",
            payload: {
              approvalId: approval.id,
              entityType: approval.entityType,
              entityId: approval.entityId,
              requestedAt: approval.requestedAt,
            },
          });
          count += 1;
        }
      }
      return count;
    });

    return { stale: stale.length, notified };
  },
);

const kycDecidedEvent = z.object({
  caseId: z.string().uuid(),
  decision: z.enum(["approved", "rejected"]),
  decidedBy: z.string(),
});

/**
 * Decision fan-out: when a KYC case is decided by someone other than its
 * assignee (e.g. an approver deciding an escalated case), tell the assignee.
 */
export const kycDecisionFanout = inngest.createFunction(
  { id: "kyc-decision-fanout", triggers: { event: "kyc.case.decided" } },
  async ({ event, step }) => {
    const db = getDb();
    const { caseId, decision, decidedBy } = kycDecidedEvent.parse(event.data);

    const kycCase = await step.run("load-case", () => getKycCase(db, caseId));
    if (!kycCase) return { notified: 0 };

    const assigneeId = kycCase.kycCase.assigneeId;
    if (!assigneeId || assigneeId === decidedBy) return { notified: 0 };

    await step.run("notify-assignee", () =>
      notify(db, {
        recipientId: assigneeId,
        type: "kyc.case.decided",
        payload: { caseId, decision, customerName: kycCase.customerName },
      }),
    );
    return { notified: 1 };
  },
);

const kycEscalatedEvent = z.object({
  caseId: z.string().uuid(),
  reason: z.string(),
  escalatedBy: z.string(),
});

/**
 * Escalation fan-out: an escalated case needs a kyc:approver decision, so
 * every approver (except the escalating analyst) is notified immediately.
 */
export const kycEscalationFanout = inngest.createFunction(
  { id: "kyc-escalation-fanout", triggers: { event: "kyc.case.escalated" } },
  async ({ event, step }) => {
    const db = getDb();
    const { caseId, reason, escalatedBy } = kycEscalatedEvent.parse(event.data);

    const kycCase = await step.run("load-case", () => getKycCase(db, caseId));
    if (!kycCase) return { notified: 0 };

    const approverIds = await step.run("list-approvers", () => listUsersWithRole("kyc:approver"));

    const notified = await step.run("send-notifications", async () => {
      let count = 0;
      for (const recipientId of approverIds) {
        if (recipientId === escalatedBy) continue;
        await notify(db, {
          recipientId,
          type: "kyc.case.escalated",
          payload: { caseId, reason, customerName: kycCase.customerName },
        });
        count += 1;
      }
      return count;
    });
    return { notified };
  },
);

/**
 * One summary notification per approver/admin each morning (08:00 UTC)
 * instead of per-item noise: overdue KYC cases + approvals awaiting decision.
 * Deduped on the date so replays never double-send.
 */
export const dailyOpsDigest = inngest.createFunction(
  { id: "daily-ops-digest", triggers: { cron: "0 8 * * *" } },
  async ({ step }) => {
    const db = getDb();

    const counts = await step.run("gather-counts", async () => {
      const [overdue, pending] = await Promise.all([
        listOverdueKycCases(db),
        listStalePendingApprovals(db, new Date()),
      ]);
      return { overdueKyc: overdue.length, pendingApprovals: pending.length };
    });
    if (counts.overdueKyc === 0 && counts.pendingApprovals === 0) return { notified: 0 };

    const date = new Date().toISOString().slice(0, 10);
    const alreadySent = await step.run("check-dedupe", () =>
      hasNotification(db, "ops.daily_digest", { date }),
    );
    if (alreadySent) return { notified: 0 };

    const users = await step.run("list-users", () => listClerkUsers());
    const recipients = users
      .filter((u) => u.roles.some((r) => r === "admin" || r.endsWith(":approver")))
      .map((u) => u.actorId);

    const notified = await step.run("send-notifications", async () => {
      for (const recipientId of recipients) {
        await notify(db, {
          recipientId,
          type: "ops.daily_digest",
          payload: { date, ...counts },
        });
      }
      return recipients.length;
    });

    return { notified };
  },
);

export const inngestFunctions = [
  kycSlaReminder,
  refundSettlement,
  approvalPendingReminder,
  kycDecisionFanout,
  kycEscalationFanout,
  dailyOpsDigest,
];
