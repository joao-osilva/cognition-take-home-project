import type { ActionResult } from "@repo/core";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Money,
  PageHeader,
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
        <Metric label="Pending requests" value={String(metrics.pendingCount)} />
        <Metric
          label="Pending amount"
          value={<Money amountCents={metrics.pendingAmount} currency="USD" />}
        />
        <Metric
          label="Approved / rejected"
          value={`${metrics.approvedCount} / ${metrics.rejectedCount}`}
        />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Amount</TableHead>
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
                <TableCell>
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
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground py-8 text-center">
                  No refund requests yet.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
