import Link from "next/link";

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
  cn,
} from "@repo/ui";

import type { FlagGroup } from "../queries";
import { FlagCell } from "./flag-cell";
import { FlagRowMenu } from "./flag-row-menu";
import { NewFlagDialog } from "./new-flag-dialog";
import { PendingChange } from "./pending-change";

const ENVIRONMENTS = ["dev", "staging", "prod"] as const;

export function FlagsScreen({
  groups,
  archivedView,
  canToggle,
  canApprove,
  onSetState,
  onDecide,
  onCreate,
  onArchive,
  onRestore,
}: {
  groups: FlagGroup[];
  archivedView: boolean;
  canToggle: boolean;
  canApprove: boolean;
  onSetState: (
    flagId: string,
    state: "on" | "off" | "percentage",
    rolloutPercentage?: number,
  ) => Promise<ActionResult>;
  onDecide: (
    approvalId: string,
    decision: "approved" | "rejected",
    reason: string,
  ) => Promise<ActionResult>;
  onCreate: (key: string, description: string) => Promise<ActionResult>;
  onArchive: (key: string) => Promise<ActionResult>;
  onRestore: (key: string) => Promise<ActionResult>;
}) {
  return (
    <div>
      <PageHeader
        title="Feature Flags"
        description="Toggle flags per environment — production changes require approval"
        actions={canToggle && !archivedView ? <NewFlagDialog onCreate={onCreate} /> : undefined}
      />
      <div className="mb-4 flex items-center gap-1" role="tablist" aria-label="Flag view">
        <ViewTab href="/flags" active={!archivedView}>
          Active
        </ViewTab>
        <ViewTab href="/flags?view=archived" active={archivedView}>
          Archived
        </ViewTab>
      </div>
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
              {canToggle ? <TableHead className="w-12" /> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((group) => (
              <TableRow key={group.key} className={cn(group.archived && "opacity-70")}>
                <TableCell>
                  <div className="font-mono text-[13px] font-medium">{group.key}</div>
                  <div className="text-muted-foreground text-xs">{group.description}</div>
                </TableCell>
                {ENVIRONMENTS.map((env) => {
                  const flag = group.environments[env];
                  if (!flag) return <TableCell key={env}>—</TableCell>;
                  if (group.archived) {
                    return (
                      <TableCell key={env}>
                        <span className="text-muted-foreground text-xs">
                          {flag.state === "percentage" && flag.rolloutPercentage != null
                            ? `${flag.rolloutPercentage}%`
                            : flag.state}
                        </span>
                      </TableCell>
                    );
                  }
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
                          onSetState={onSetState}
                        />
                        {hasPending && group.pendingProdChange ? (
                          <PendingChange
                            approvalId={group.pendingProdChange.approvalId}
                            proposedState={group.pendingProdChange.proposedState}
                            proposedRolloutPercentage={
                              group.pendingProdChange.proposedRolloutPercentage
                            }
                            canDecide={canApprove}
                            onDecide={onDecide}
                          />
                        ) : null}
                      </div>
                    </TableCell>
                  );
                })}
                {canToggle ? (
                  <TableCell>
                    <FlagRowMenu
                      flagKey={group.key}
                      archived={group.archived}
                      onArchive={onArchive}
                      onRestore={onRestore}
                    />
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {groups.length === 0 ? (
          archivedView ? (
            <EmptyState
              title="No archived flags"
              hint="Flags you archive appear here and can be restored."
              className="m-4"
            />
          ) : (
            <EmptyState
              title="No feature flags yet"
              hint="Create a flag to define it across dev, staging, and prod."
              className="m-4"
            />
          )
        ) : null}
      </div>
    </div>
  );
}

function ViewTab({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      role="tab"
      aria-selected={active}
      className={cn(
        "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}
