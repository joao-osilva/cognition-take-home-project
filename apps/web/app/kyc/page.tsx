import { kycAppMeta, listKycCases } from "@repo/app-kyc";
import { KycQueueScreen } from "@repo/app-kyc/screens";

import { createKycCaseAction } from "./actions";

import { Pagination } from "@/components/pagination";
import { getActor } from "@/lib/actor";
import { getDb } from "@/lib/db";
import { canView, NoAccess } from "@/lib/guard";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

export default async function KycPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; risk?: string; page?: string }>;
}) {
  const actor = await getActor();
  if (!canView(actor, kycAppMeta.requiredRole)) return <NoAccess />;

  const params = await searchParams;
  const filters = {
    status: params.status === "all" ? undefined : params.status,
    riskLevel: params.risk === "all" ? undefined : params.risk,
  };
  const allCases = await listKycCases(getDb(), filters);
  const page = Math.max(Number(params.page ?? "1") || 1, 1);
  const totalPages = Math.max(Math.ceil(allCases.length / PAGE_SIZE), 1);
  const cases = allCases.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <KycQueueScreen
        cases={cases}
        total={allCases.length}
        filters={filters}
        onCreateCase={createKycCaseAction}
      />
      <Pagination page={page} totalPages={totalPages} total={allCases.length} noun="case" />
    </div>
  );
}
