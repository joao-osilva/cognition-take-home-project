"use server";

import { revalidatePath } from "next/cache";

import { put } from "@vercel/blob";

import { claimCase, decideCase, escalateCase, uploadDocument } from "@repo/app-kyc";
import { hasRole, toActionResult, type ActionResult } from "@repo/core";

import { getActor } from "@/lib/actor";
import { getDb } from "@/lib/db";

async function ctx() {
  return { db: getDb(), actor: await getActor() };
}

function revalidate(caseId: string) {
  revalidatePath("/kyc");
  revalidatePath(`/kyc/${caseId}`);
}

export async function claimCaseAction(caseId: string): Promise<ActionResult> {
  const result = await toActionResult(claimCase(await ctx(), { caseId }));
  revalidate(caseId);
  return result;
}

export async function decideCaseAction(
  caseId: string,
  decision: "approved" | "rejected",
  reason: string,
): Promise<ActionResult> {
  const result = await toActionResult(decideCase(await ctx(), { caseId, decision, reason }));
  revalidate(caseId);
  return result;
}

export async function escalateCaseAction(caseId: string, reason: string): Promise<ActionResult> {
  const result = await toActionResult(escalateCase(await ctx(), { caseId, reason }));
  revalidate(caseId);
  return result;
}

const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp"]);

export async function uploadKycDocumentAction(
  caseId: string,
  formData: FormData,
): Promise<ActionResult> {
  const context = await ctx();
  if (!hasRole(context.actor, "kyc:operator")) {
    return { ok: false, error: "You do not have permission to upload documents" };
  }

  const file = formData.get("file");
  const type = formData.get("type");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "No file provided" };
  if (file.size > MAX_DOCUMENT_BYTES) return { ok: false, error: "File exceeds the 10 MB limit" };
  if (!ALLOWED_CONTENT_TYPES.has(file.type)) {
    return { ok: false, error: "Only PDF, PNG, JPEG, or WebP files are allowed" };
  }

  // Store under a random pathname in the private Blob store; the DB row's
  // blobUrl holds the pathname, and reads go through the authenticated
  // /kyc/documents/[documentId] route.
  const pathname = `kyc/${caseId}/${crypto.randomUUID()}`;
  const blob = await put(pathname, file, {
    access: "private",
    contentType: file.type,
  });

  const result = await toActionResult(
    uploadDocument(context, {
      caseId,
      type: String(type) as "passport" | "proof_of_address" | "selfie" | "other",
      blobUrl: blob.pathname,
    }),
  );
  revalidate(caseId);
  return result;
}
