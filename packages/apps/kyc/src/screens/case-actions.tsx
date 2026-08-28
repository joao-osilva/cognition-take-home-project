"use client";

import { useTransition } from "react";

import type { ActionResult } from "@repo/core";
import { Button, ReasonDialog, toast } from "@repo/ui";

export interface KycCaseActions {
  claim: () => Promise<ActionResult>;
  release: () => Promise<ActionResult>;
  removeDocument: (documentId: string) => Promise<ActionResult>;
  decide: (decision: "approved" | "rejected", reason: string) => Promise<ActionResult>;
  escalate: (reason: string) => Promise<ActionResult>;
  uploadDocument: (formData: FormData) => Promise<ActionResult>;
}

export function CaseActions({
  status,
  isAssignee,
  actions,
}: {
  status: string;
  isAssignee: boolean;
  actions: KycCaseActions;
}) {
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<ActionResult>, success: string, done?: () => void) =>
    startTransition(async () => {
      const result = await fn();
      if (result.ok) {
        toast.success(success);
        done?.();
      } else {
        toast.error(result.error);
      }
    });

  if (status === "pending") {
    return (
      <Button disabled={pending} onClick={() => run(actions.claim, "Case claimed")}>
        Claim case
      </Button>
    );
  }

  if (status !== "in_review" && status !== "escalated") return null;

  return (
    <div className="flex flex-wrap gap-2">
      {status === "in_review" && isAssignee ? (
        <Button
          variant="outline"
          disabled={pending}
          onClick={() => run(actions.release, "Case released back to the queue")}
        >
          Release case
        </Button>
      ) : null}
      <ReasonDialog
        title="Approve case"
        description="Record the reason for approving this KYC case."
        trigger={<Button disabled={pending}>Approve</Button>}
        confirmLabel="Approve"
        onConfirm={(reason, close) =>
          run(() => actions.decide("approved", reason), "Case approved", close)
        }
      />
      <ReasonDialog
        title="Reject case"
        description="Record the reason for rejecting this KYC case."
        trigger={
          <Button variant="destructive" disabled={pending}>
            Reject
          </Button>
        }
        confirmLabel="Reject"
        onConfirm={(reason, close) =>
          run(() => actions.decide("rejected", reason), "Case rejected", close)
        }
      />
      {status === "in_review" ? (
        <ReasonDialog
          title="Escalate case"
          description="Escalated cases must be decided by a senior reviewer other than you."
          trigger={
            <Button variant="outline" disabled={pending}>
              Escalate
            </Button>
          }
          confirmLabel="Escalate"
          onConfirm={(reason, close) =>
            run(() => actions.escalate(reason), "Case escalated", close)
          }
        />
      ) : null}
    </div>
  );
}
