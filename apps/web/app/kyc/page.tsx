import { kycAppMeta, listKycCases } from "@repo/app-kyc";
import { KycQueueScreen } from "@repo/app-kyc/screens";

import { getActor } from "@/lib/actor";
import { getDb } from "@/lib/db";
import { canView, NoAccess } from "@/lib/guard";

export const dynamic = "force-dynamic";

export default async function KycPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; risk?: string }>;
}) {
  const actor = await getActor();
  if (!canView(actor, kycAppMeta.requiredRole)) return <NoAccess />;

  const params = await searchParams;
  const filters = {
    status: params.status === "all" ? undefined : params.status,
    riskLevel: params.risk === "all" ? undefined : params.risk,
  };
  const cases = await listKycCases(getDb(), filters);

  return <KycQueueScreen cases={cases} filters={filters} />;
}
