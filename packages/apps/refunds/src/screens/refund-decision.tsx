"use client";

import { useTransition } from "react";

import type { ActionResult } from "@repo/core";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  ReasonDialog,
  toast,
} from "@repo/ui";

export function RefundDecision({
  approvalId,
  isRequester,
  onDecide,
}: {
  approvalId: string;
  isRequester: boolean;
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

  if (isRequester) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-200">
        <p className="font-medium">Awaiting a second approver</p>
        <p className="mt-1">
          You requested this refund, so the two-person rule blocks you from approving or rejecting
          it. Another approver has to decide.
        </p>
        <div className="mt-3 flex justify-end gap-2">
          <SelfDecisionBlocked trigger={<Button size="sm">Approve</Button>} />
          <SelfDecisionBlocked
            trigger={
              <Button size="sm" variant="destructive">
                Reject
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end gap-2">
      <ReasonDialog
        title="Approve refund"
        description="Record the reason for approving this refund. It is written to the audit log."
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

function SelfDecisionBlocked({ trigger }: { trigger: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>A second approver is required</DialogTitle>
          <DialogDescription>
            You requested this refund. Under the two-person rule the person who raises a refund can
            never approve or reject it, so a different approver has to decide.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
