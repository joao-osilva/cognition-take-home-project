import type { ActionResult } from "@repo/core";
import {
  EmptyState,
  Money,
  PageHeader,
  StatCard,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui";

import type { RefundMetrics, RefundRow, RefundableTransaction } from "../queries";
import { RefundDecision } from "./refund-decision";
import { RequestRefundDialog } from "./request-dialog";

export function RefundsDashboardScreen({
  rows,
  metrics,
  transactions,
  canRequest,
  canDecide,
  onRequest,
  onDecide,
}: {
  rows: RefundRow[];
  metrics: RefundMetrics;
  transactions: RefundableTransaction[];
  canRequest: boolean;
  canDecide: boolean;
  onRequest: (transactionId: string, amountCents: number, reason: string) => Promise<ActionResult>;
  onDecide: (
    approvalId: string,
    decision: "approved" | "rejected",
    reason: string,
  ) => Promise<ActionResult>;
}) {
  return (
    <div>
      <PageHeader
        title="Refunds Dashboard"
        description="Request refunds and run maker-checker approvals"
        actions={
          canRequest ? (
            <RequestRefundDialog transactions={transactions} onRequest={onRequest} />
          ) : undefined
        }
      />
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Pending requests" value={String(metrics.pendingCount)} />
        <StatCard
          label="Pending amount"
          value={<Money amountCents={metrics.pendingAmount} currency="USD" />}
        />
        <StatCard
          label="Approved / rejected"
          value={`${metrics.approvedCount} / ${metrics.rejectedCount}`}
        />
      </div>
      <div className="bg-card overflow-x-auto rounded-lg border shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Requested by</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ refund, customerName, requesterName, approvalId }) => (
              <TableRow key={refund.id}>
                <TableCell className="font-medium">{customerName}</TableCell>
                <TableCell className="text-right">
                  <Money amountCents={refund.amount} currency={refund.currency} />
                </TableCell>
                <TableCell className="text-muted-foreground max-w-64 truncate">
                  {refund.reason}
                </TableCell>
                <TableCell>
                  <StatusBadge status={refund.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {requesterName ?? refund.requestedBy}
                </TableCell>
                <TableCell className="text-right">
                  {canDecide && approvalId && refund.status === "pending_approval" ? (
                    <RefundDecision approvalId={approvalId} onDecide={onDecide} />
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {rows.length === 0 ? (
          <EmptyState
            title="No refund requests yet"
            hint="Submitted requests appear here for review and approval."
            className="m-4"
          />
        ) : null}
      </div>
    </div>
  );
}
