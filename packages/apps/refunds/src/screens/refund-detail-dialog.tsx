"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { ActionResult } from "@repo/core";
import {
  AuditTrail,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Money,
  Separator,
  StatusBadge,
  formatDateTime,
} from "@repo/ui";

import { refundActionLabel } from "../labels";
import type { RefundDetail } from "../queries";
import { RefundDecision } from "./refund-decision";

export function RefundDetailDialog({
  detail,
  canDecide,
  onDecide,
}: {
  detail: RefundDetail;
  canDecide: boolean;
  onDecide: (
    approvalId: string,
    decision: "approved" | "rejected",
    reason: string,
  ) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const close = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("refund");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const { refund } = detail;
  const decided = ["approved", "rejected", "processed"].includes(refund.status);

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : close())}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Refund · {detail.customerName}</DialogTitle>
          <DialogDescription>Full request details and activity history.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 text-sm">
          <Row label="Status">
            <StatusBadge status={refund.status} />
          </Row>
          <Row label="Amount">
            <Money amountCents={refund.amount} currency={refund.currency} />
          </Row>
          <Row label="Transaction">
            <span className="font-mono text-xs">{refund.transactionId}</span>
          </Row>
          <Row label="Requested by">{detail.requesterName ?? refund.requestedBy}</Row>
          <Row label="Requested at">
            <span className="font-mono text-xs tabular-nums">
              {formatDateTime(refund.createdAt)}
            </span>
          </Row>
          {decided ? (
            <Row label="Last updated">
              <span className="font-mono text-xs tabular-nums">
                {formatDateTime(refund.updatedAt)}
              </span>
            </Row>
          ) : null}
          <Row label="Reason">
            <span className="break-words">{refund.reason}</span>
          </Row>
        </div>
        {canDecide && detail.approvalId && refund.status === "pending_approval" ? (
          <RefundDecision approvalId={detail.approvalId} onDecide={onDecide} />
        ) : null}
        <Separator />
        <div>
          <h3 className="mb-3 text-sm font-medium">Activity</h3>
          <AuditTrail
            entries={detail.auditTrail.map((e) => ({
              ...e,
              actionLabel: refundActionLabel(e.action),
            }))}
            pageSize={5}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="min-w-0 text-right break-words">{children}</span>
    </div>
  );
}
