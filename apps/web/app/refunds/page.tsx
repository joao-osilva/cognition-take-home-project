import {
  computeMetrics,
  getRefundDetail,
  listRefundRequesters,
  listRefunds,
  refundsAppMeta,
} from "@repo/app-refunds";
import { RefundsDashboardScreen } from "@repo/app-refunds/screens";
import { hasRole } from "@repo/core";

import { Pagination } from "@/components/pagination";
import { getActor } from "@/lib/actor";
import { getDb } from "@/lib/db";
import { canView, NoAccess } from "@/lib/guard";

import { decideRefundAction, requestRefundAction, searchTransactionsAction } from "./actions";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

export default async function RefundsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; requester?: string; refund?: string }>;
}) {
  const actor = await getActor();
  if (!canView(actor, refundsAppMeta.requiredRole)) return <NoAccess />;

  const db = getDb();
  const params = await searchParams;
  const status = params.status && params.status !== "all" ? params.status : undefined;
  const requestedBy = params.requester && params.requester !== "all" ? params.requester : undefined;

  const rows = await listRefunds(db, { status, requestedBy });
  const requesters = await listRefundRequesters(db);
  const detail = params.refund ? ((await getRefundDetail(db, params.refund)) ?? null) : null;

  const page = Math.max(Number(params.page ?? "1") || 1, 1);
  const totalPages = Math.max(Math.ceil(rows.length / PAGE_SIZE), 1);
  const pagedRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <RefundsDashboardScreen
        rows={pagedRows}
        metrics={computeMetrics(rows)}
        detail={detail}
        status={status}
        requestedBy={requestedBy}
        requesters={requesters}
        canRequest={hasRole(actor, "refunds:operator")}
        canDecide={hasRole(actor, "refunds:approver")}
        onRequest={requestRefundAction}
        onDecide={decideRefundAction}
        onSearchTransactions={searchTransactionsAction}
      />
      <Pagination page={page} totalPages={totalPages} total={rows.length} noun="refund" />
    </div>
  );
}
