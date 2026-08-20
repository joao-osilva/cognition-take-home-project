"use client";

import { useTransition } from "react";

import type { ActionResult } from "@repo/core";
import { Button, ReasonDialog, toast } from "@repo/ui";

export function RefundDecision({
  approvalId,
  onDecide,
}: {
  approvalId: string;
  onDecide: (
    approvalId: string,
    decision: "approved" | "rejected",
    reason: string,
  ) => Promise<ActionResult>;
}) {
  const [pending, startTransition] = useTransition();

  const run = (decision: "approved" | "rejected", reason: string, close: () => void) =>
    startTransition(async () => {
      const result = await onDecide(approvalId, decision, reason);
      if (result.ok) {
        toast.success(`Refund ${decision}`);
        close();
      } else {
        toast.error(result.error);
      }
    });

  return (
    <div className="flex justify-end gap-2">
      <ReasonDialog
        title="Approve refund"
        description="You cannot approve refunds you requested yourself."
        trigger={
          <Button size="sm" disabled={pending}>
            Approve
          </Button>
        }
        confirmLabel="Approve"
        onConfirm={(reason, close) => run("approved", reason, close)}
      />
      <ReasonDialog
        title="Reject refund"
        description="Record the reason for rejecting this refund."
        trigger={
          <Button size="sm" variant="destructive" disabled={pending}>
            Reject
          </Button>
        }
        confirmLabel="Reject"
        onConfirm={(reason, close) => run("rejected", reason, close)}
      />
    </div>
  );
}
