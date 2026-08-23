import { notFound } from "next/navigation";

import { getKycCase, kycAppMeta } from "@repo/app-kyc";
import { KycCaseScreen } from "@repo/app-kyc/screens";

import { getActor } from "@/lib/actor";
import { getDb } from "@/lib/db";
import { canView, NoAccess } from "@/lib/guard";

import {
  claimCaseAction,
  decideCaseAction,
  escalateCaseAction,
  uploadKycDocumentAction,
} from "../actions";

export const dynamic = "force-dynamic";

export default async function KycCasePage({ params }: { params: Promise<{ caseId: string }> }) {
  const actor = await getActor();
  if (!canView(actor, kycAppMeta.requiredRole)) return <NoAccess />;

  const { caseId } = await params;
  const detail = await getKycCase(getDb(), caseId);
  if (!detail) notFound();

  return (
    <KycCaseScreen
      detail={detail}
      actions={{
        claim: claimCaseAction.bind(null, caseId),
        decide: decideCaseAction.bind(null, caseId),
        escalate: escalateCaseAction.bind(null, caseId),
        uploadDocument: uploadKycDocumentAction.bind(null, caseId),
      }}
    />
  );
}
