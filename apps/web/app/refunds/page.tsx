import {
  computeMetrics,
  listRefundableTransactions,
  listRefunds,
  refundsAppMeta,
} from "@repo/app-refunds";
import { RefundsDashboardScreen } from "@repo/app-refunds/screens";
import { hasRole } from "@repo/core";

import { Pagination } from "@/components/pagination";
import { getActor } from "@/lib/actor";
import { getDb } from "@/lib/db";
import { canView, NoAccess } from "@/lib/guard";

import { decideRefundAction, requestRefundAction } from "./actions";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

export default async function RefundsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const actor = await getActor();
  if (!canView(actor, refundsAppMeta.requiredRole)) return <NoAccess />;

  const db = getDb();
  const rows = await listRefunds(db);
  const transactions = await listRefundableTransactions(db);

  const params = await searchParams;
  const page = Math.max(Number(params.page ?? "1") || 1, 1);
  const totalPages = Math.max(Math.ceil(rows.length / PAGE_SIZE), 1);
  const pagedRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <RefundsDashboardScreen
        rows={pagedRows}
        metrics={computeMetrics(rows)}
        transactions={transactions}
        canRequest={hasRole(actor, "refunds:operator")}
        canDecide={hasRole(actor, "refunds:approver")}
        onRequest={requestRefundAction}
        onDecide={decideRefundAction}
      />
      <Pagination page={page} totalPages={totalPages} total={rows.length} noun="refund" />
    </div>
  );
}
