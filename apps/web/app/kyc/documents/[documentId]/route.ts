import { NextResponse } from "next/server";

import { get } from "@vercel/blob";

import { getKycDocument } from "@repo/app-kyc";
import { hasRole, writeAudit } from "@repo/core";

import { getActor } from "@/lib/actor";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Streams a KYC document from the private Blob store to authorized reviewers.
 * Every access is audited (kyc.document.viewed) since documents contain PII.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const actor = await getActor();
  if (!hasRole(actor, "kyc:operator")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { documentId } = await params;
  const db = getDb();
  const document = await getKycDocument(db, documentId);
  if (!document) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await writeAudit(db, actor, {
    action: "kyc.document.viewed",
    entityType: "kyc_document",
    entityId: document.id,
    metadata: { caseId: document.caseId, type: document.type },
  });

  // Seed/demo rows store an external URL instead of a Blob pathname.
  if (document.blobUrl.startsWith("http")) return NextResponse.redirect(document.blobUrl);

  const result = await get(document.blobUrl, { access: "private" });
  if (!result || !result.stream) {
    return NextResponse.json({ error: "Document content not found" }, { status: 404 });
  }

  return new NextResponse(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType ?? "application/octet-stream",
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store",
    },
  });
}
