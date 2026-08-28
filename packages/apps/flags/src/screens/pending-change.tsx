"use client";

import { useTransition } from "react";

import type { ActionResult } from "@repo/core";
import { Badge, Button, ReasonDialog, toast } from "@repo/ui";

export function PendingChange({
  approvalId,
  proposedState,
  proposedRolloutPercentage,
  canDecide,
  onDecide,
}: {
  approvalId: string;
  proposedState: string;
  proposedRolloutPercentage: number | null;
  canDecide: boolean;
  onDecide: (
    approvalId: string,
    decision: "approved" | "rejected",
    reason: string,
  ) => Promise<ActionResult>;
}) {
  const [pending, startTransition] = useTransition();

  const proposedLabel =
    proposedState === "percentage" && proposedRolloutPercentage != null
      ? `${proposedRolloutPercentage}% rollout`
      : proposedState;

  const run = (decision: "approved" | "rejected", reason: string, close: () => void) =>
    startTransition(async () => {
      const result = await onDecide(approvalId, decision, reason);
      if (result.ok) {
        toast.success(`Prod change ${decision}`);
        close();
      } else {
        toast.error(result.error);
      }
    });

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline">pending: {proposedLabel}</Badge>
      {canDecide ? (
        <>
          <ReasonDialog
            title="Approve prod flag change"
            description={`Apply the pending change (${proposedLabel}) to production.`}
            trigger={
              <Button size="sm" variant="outline" disabled={pending}>
                Approve
              </Button>
            }
            confirmLabel="Approve"
            onConfirm={(reason, close) => run("approved", reason, close)}
          />
          <ReasonDialog
            title="Reject prod flag change"
            description="Record the reason for rejecting this change."
            trigger={
              <Button size="sm" variant="ghost" disabled={pending}>
                Reject
              </Button>
            }
            confirmLabel="Reject"
            onConfirm={(reason, close) => run("rejected", reason, close)}
          />
        </>
      ) : null}
    </div>
  );
}
