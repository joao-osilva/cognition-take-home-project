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
  formatRelativeTime,
} from "@repo/ui";

import type {
  RefundDetail,
  RefundMetrics,
  RefundRequester,
  RefundRow,
  RefundableTransaction,
} from "../queries";
import { RefundsFilterBar } from "./filter-bar";
import { RefundDetailDialog } from "./refund-detail-dialog";
import { RefundTableRow } from "./refund-row";
import { RequestRefundDialog } from "./request-dialog";

export function RefundsDashboardScreen({
  rows,
  metrics,
  detail,
  status,
  requestedBy,
  requesters,
  canRequest,
  canDecide,
  onRequest,
  onDecide,
  onSearchTransactions,
}: {
  rows: RefundRow[];
  metrics: RefundMetrics;
  detail: RefundDetail | null;
  status?: string;
  requestedBy?: string;
  requesters: RefundRequester[];
  canRequest: boolean;
  canDecide: boolean;
  onRequest: (transactionId: string, amountCents: number, reason: string) => Promise<ActionResult>;
  onDecide: (
    approvalId: string,
    decision: "approved" | "rejected",
    reason: string,
  ) => Promise<ActionResult>;
  onSearchTransactions: (query: string) => Promise<RefundableTransaction[]>;
}) {
  return (
    <div>
      <PageHeader
        title="Refunds Dashboard"
        description="Request refunds and run maker-checker approvals"
        actions={
          canRequest ? (
            <RequestRefundDialog onRequest={onRequest} onSearch={onSearchTransactions} />
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
      <RefundsFilterBar status={status} requestedBy={requestedBy} requesters={requesters} />
      <div className="bg-card overflow-x-auto rounded-lg border shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Requested by</TableHead>
              <TableHead>Requested</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ refund, customerName, requesterName }) => (
              <RefundTableRow key={refund.id} refundId={refund.id}>
                <TableCell className="font-medium">{customerName}</TableCell>
                <TableCell className="text-right">
                  <Money amountCents={refund.amount} currency={refund.currency} />
                </TableCell>
                <TableCell
                  className="text-muted-foreground max-w-64 truncate"
                  title={refund.reason}
                >
                  {refund.reason}
                </TableCell>
                <TableCell>
                  <StatusBadge status={refund.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {requesterName ?? refund.requestedBy}
                </TableCell>
                <TableCell
                  className="text-muted-foreground font-mono text-xs tabular-nums whitespace-nowrap"
                  title={refund.createdAt.toISOString()}
                >
                  {formatRelativeTime(refund.createdAt)}
                </TableCell>
              </RefundTableRow>
            ))}
          </TableBody>
        </Table>
        {rows.length === 0 ? (
          <EmptyState
            title="No refund requests found"
            hint="Submitted requests appear here for review and approval."
            className="m-4"
          />
        ) : null}
      </div>
      {detail ? (
        <RefundDetailDialog detail={detail} canDecide={canDecide} onDecide={onDecide} />
      ) : null}
    </div>
  );
}
