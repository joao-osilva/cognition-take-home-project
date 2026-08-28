import {
  EmptyState,
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

import type { ActionResult } from "@repo/core";

import type { KycCaseRow } from "../queries";
import { KycFilterBar } from "./filter-bar";
import { NewCaseDialog, type NewKycCaseInput } from "./new-case-dialog";

function slaLabel(slaDueAt: Date | null): { text: string; overdue: boolean } {
  if (!slaDueAt) return { text: "—", overdue: false };
  const hours = Math.round((slaDueAt.getTime() - Date.now()) / 3_600_000);
  if (hours < 0) return { text: `${-hours}h overdue`, overdue: true };
  return { text: `${hours}h left`, overdue: false };
}

export function KycQueueScreen({
  cases,
  total,
  filters,
  onCreateCase,
}: {
  cases: KycCaseRow[];
  total?: number;
  filters: { status?: string; riskLevel?: string; customer?: string };
  onCreateCase?: (input: NewKycCaseInput) => Promise<ActionResult>;
}) {
  const caseCount = total ?? cases.length;
  return (
    <div>
      <PageHeader
        title="KYC Review Queue"
        description="Review, decide, and escalate customer KYC cases"
        actions={onCreateCase ? <NewCaseDialog onCreate={onCreateCase} /> : undefined}
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <KycFilterBar
          status={filters.status}
          riskLevel={filters.riskLevel}
          customer={filters.customer}
        />
        <span className="text-muted-foreground text-xs">
          {caseCount} case{caseCount === 1 ? "" : "s"}
        </span>
      </div>
      <div className="bg-card overflow-x-auto rounded-lg border shadow-xs">
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
                <TableRow
                  key={kycCase.id}
                  className="hover:bg-muted/50 group relative cursor-pointer transition-colors duration-150"
                >
                  <TableCell>
                    <a href={`/kyc/${kycCase.id}`} className="block after:absolute after:inset-0">
                      <span className="group-hover:text-primary block font-medium transition-colors">
                        {customerName}
                      </span>
                      <span className="text-muted-foreground block text-xs">{customerEmail}</span>
                    </a>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={kycCase.status} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={kycCase.riskLevel} variant="dot" />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{assigneeName ?? "—"}</TableCell>
                  <TableCell
                    className={cn(
                      "font-mono text-xs tabular-nums",
                      open && sla.overdue
                        ? "font-medium text-red-600 dark:text-red-400"
                        : "text-muted-foreground",
                    )}
                  >
                    {open ? sla.text : "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {cases.length === 0 ? (
          <EmptyState
            title="No cases match the current filters"
            hint="Try clearing the status or risk filters."
            className="m-4"
          />
        ) : null}
      </div>
    </div>
  );
}
