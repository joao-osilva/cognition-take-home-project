import {
  computeMetrics,
  listRefundableTransactions,
  listRefunds,
  refundsAppMeta,
} from "@repo/app-refunds";
import { RefundsDashboardScreen } from "@repo/app-refunds/screens";
import { hasRole } from "@repo/core";

import { getActor } from "@/lib/actor";
import { getDb } from "@/lib/db";
import { canView, NoAccess } from "@/lib/guard";

import { decideRefundAction, requestRefundAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function RefundsPage() {
  const actor = await getActor();
  if (!canView(actor, refundsAppMeta.requiredRole)) return <NoAccess />;

  const db = getDb();
  const rows = await listRefunds(db);
  const transactions = await listRefundableTransactions(db);

  return (
    <RefundsDashboardScreen
      rows={rows}
      metrics={computeMetrics(rows)}
      transactions={transactions}
      canRequest={hasRole(actor, "refunds:operator")}
      canDecide={hasRole(actor, "refunds:approver")}
      onRequest={requestRefundAction}
      onDecide={decideRefundAction}
    />
  );
}
