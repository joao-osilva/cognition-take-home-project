import { flagsAppMeta, listFlagGroups } from "@repo/app-flags";
import { FlagsScreen } from "@repo/app-flags/screens";
import { hasRole } from "@repo/core";

import { Pagination } from "@/components/pagination";
import { getActor } from "@/lib/actor";
import { getDb } from "@/lib/db";
import { canView, NoAccess } from "@/lib/guard";

import {
  archiveFlagAction,
  createFlagAction,
  decideFlagChangeAction,
  restoreFlagAction,
  setFlagStateAction,
} from "./actions";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

export default async function FlagsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; view?: string }>;
}) {
  const actor = await getActor();
  if (!canView(actor, flagsAppMeta.requiredRole)) return <NoAccess />;

  const params = await searchParams;
  const archivedView = params.view === "archived";
  const groups = await listFlagGroups(getDb(), { archived: archivedView });

  const page = Math.max(Number(params.page ?? "1") || 1, 1);
  const totalPages = Math.max(Math.ceil(groups.length / PAGE_SIZE), 1);
  const pagedGroups = groups.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <FlagsScreen
        groups={pagedGroups}
        archivedView={archivedView}
        canToggle={hasRole(actor, "flags:operator")}
        canApprove={hasRole(actor, "flags:approver")}
        onSetState={setFlagStateAction}
        onDecide={decideFlagChangeAction}
        onCreate={createFlagAction}
        onArchive={archiveFlagAction}
        onRestore={restoreFlagAction}
      />
      <Pagination page={page} totalPages={totalPages} total={groups.length} noun="flag" />
    </div>
  );
}
