import type { ActionResult } from "@repo/core";
import {
  EmptyState,
  PageHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui";

import type { FlagGroup } from "../queries";
import { FlagCell } from "./flag-cell";
import { PendingChange } from "./pending-change";

const ENVIRONMENTS = ["dev", "staging", "prod"] as const;

export function FlagsScreen({
  groups,
  canToggle,
  canApprove,
  onToggle,
  onDecide,
}: {
  groups: FlagGroup[];
  canToggle: boolean;
  canApprove: boolean;
  onToggle: (flagId: string, state: "on" | "off") => Promise<ActionResult>;
  onDecide: (
    approvalId: string,
    decision: "approved" | "rejected",
    reason: string,
  ) => Promise<ActionResult>;
}) {
  return (
    <div>
      <PageHeader
        title="Feature Flags"
        description="Toggle flags per environment — production changes require approval"
      />
      <div className="bg-card overflow-x-auto rounded-lg border shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Flag</TableHead>
              {ENVIRONMENTS.map((env) => (
                <TableHead key={env} className="capitalize">
                  {env}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((group) => (
              <TableRow key={group.key}>
                <TableCell>
                  <div className="font-mono text-[13px] font-medium">{group.key}</div>
                  <div className="text-muted-foreground text-xs">{group.description}</div>
                </TableCell>
                {ENVIRONMENTS.map((env) => {
                  const flag = group.environments[env];
                  if (!flag) return <TableCell key={env}>—</TableCell>;
                  const hasPending = env === "prod" && group.pendingProdChange;
                  return (
                    <TableCell key={env}>
                      <div className="flex flex-col gap-2">
                        <FlagCell
                          flagId={flag.id}
                          environment={env}
                          state={flag.state}
                          rolloutPercentage={flag.rolloutPercentage}
                          disabled={!canToggle || Boolean(hasPending)}
                          onToggle={onToggle}
                        />
                        {hasPending && group.pendingProdChange ? (
                          <PendingChange
                            approvalId={group.pendingProdChange.approvalId}
                            proposedState={group.pendingProdChange.proposedState}
                            canDecide={canApprove}
                            onDecide={onDecide}
                          />
                        ) : null}
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {groups.length === 0 ? (
          <EmptyState
            title="No feature flags yet"
            hint="Flags appear here once they are defined for an environment."
            className="m-4"
          />
        ) : null}
      </div>
    </div>
  );
}
