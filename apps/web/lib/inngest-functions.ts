import { hasNotification, notify } from "@repo/core";
import { listOverdueKycCases } from "@repo/app-kyc";

import { listClerkUsers } from "@/lib/admin";
import { getDb } from "@/lib/db";
import { inngest } from "@/lib/inngest";

const OVERDUE_TYPE = "kyc.sla_overdue";

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

    const users = await step.run("list-users", () => listClerkUsers());
    const approverIds = users
      .filter((u) => u.roles.some((r) => r === "kyc:approver" || r === "admin"))
      .map((u) => u.actorId);

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

export const inngestFunctions = [kycSlaReminder];
