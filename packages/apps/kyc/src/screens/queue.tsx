import {
  PageHeader,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cn,
} from "@repo/ui";

import type { KycCaseRow } from "../queries";
import { KycFilterBar } from "./filter-bar";

function slaLabel(slaDueAt: Date | null): { text: string; overdue: boolean } {
  if (!slaDueAt) return { text: "—", overdue: false };
  const hours = Math.round((slaDueAt.getTime() - Date.now()) / 3_600_000);
  if (hours < 0) return { text: `${-hours}h overdue`, overdue: true };
  return { text: `${hours}h left`, overdue: false };
}

export function KycQueueScreen({
  cases,
  filters,
}: {
  cases: KycCaseRow[];
  filters: { status?: string; riskLevel?: string };
}) {
  return (
    <div>
      <PageHeader
        title="KYC Review Queue"
        description="Review, decide, and escalate customer KYC cases"
      />
      <KycFilterBar status={filters.status} riskLevel={filters.riskLevel} />
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>SLA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cases.map(({ kycCase, customerName, customerEmail, assigneeName }) => {
              const sla = slaLabel(kycCase.slaDueAt);
              const open = ["pending", "in_review", "escalated"].includes(kycCase.status);
              return (
                <TableRow key={kycCase.id}>
                  <TableCell>
                    <a href={`/kyc/${kycCase.id}`} className="block">
                      <span className="block font-medium">{customerName}</span>
                      <span className="text-muted-foreground block text-xs">{customerEmail}</span>
                    </a>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={kycCase.status} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={kycCase.riskLevel} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{assigneeName ?? "—"}</TableCell>
                  <TableCell
                    className={cn(
                      open && sla.overdue ? "font-medium text-red-600" : "text-muted-foreground",
                    )}
                  >
                    {open ? sla.text : "—"}
                  </TableCell>
                </TableRow>
              );
            })}
            {cases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                  No cases match the current filters.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
