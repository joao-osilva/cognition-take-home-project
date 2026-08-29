"use server";

import { revalidatePath } from "next/cache";

import { del, put } from "@vercel/blob";

import {
  claimCase,
  createCase,
  decideCase,
  escalateCase,
  releaseCase,
  removeDocument,
  uploadDocument,
} from "@repo/app-kyc";
import type { NewKycCaseInput } from "@repo/app-kyc/screens";
import { hasRole, toActionResult, type ActionResult } from "@repo/core";

import { getActor } from "@/lib/actor";
import { getDb } from "@/lib/db";
import { sendEvent } from "@/lib/inngest";

async function ctx() {
  return { db: getDb(), actor: await getActor() };
}

function revalidate(caseId: string) {
  revalidatePath("/kyc");
  revalidatePath(`/kyc/${caseId}`);
}

export async function createKycCaseAction(input: NewKycCaseInput): Promise<ActionResult> {
  const result = await toActionResult(createCase(await ctx(), input));
  revalidatePath("/kyc");
  return result;
}

export async function claimCaseAction(caseId: string): Promise<ActionResult> {
  const result = await toActionResult(claimCase(await ctx(), { caseId }));
  revalidate(caseId);
  return result;
}

export async function releaseCaseAction(caseId: string): Promise<ActionResult> {
  const result = await toActionResult(releaseCase(await ctx(), { caseId }));
  revalidate(caseId);
  return result;
}

export async function removeKycDocumentAction(
  caseId: string,
  documentId: string,
): Promise<ActionResult> {
  let blobUrl: string;
  try {
    ({ blobUrl } = await removeDocument(await ctx(), { documentId }));
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Something went wrong" };
  }
  try {
    await del(blobUrl);
  } catch (error) {
    // The DB row and audit entry are the source of truth; a stray blob is
    // harmless in the private store and can be cleaned up out of band.
    console.error("Blob delete failed", error);
  }
  revalidate(caseId);
  return { ok: true };
}

export async function decideCaseAction(
  caseId: string,
  decision: "approved" | "rejected",
  reason: string,
): Promise<ActionResult> {
  const context = await ctx();
  const result = await toActionResult(decideCase(context, { caseId, decision, reason }));
  if (result.ok) {
    await sendEvent("kyc.case.decided", { caseId, decision, decidedBy: context.actor.id });
  }
  revalidate(caseId);
  return result;
}

export async function escalateCaseAction(caseId: string, reason: string): Promise<ActionResult> {
  const context = await ctx();
  const result = await toActionResult(escalateCase(context, { caseId, reason }));
  if (result.ok) {
    await sendEvent("kyc.case.escalated", { caseId, reason, escalatedBy: context.actor.id });
  }
  revalidate(caseId);
  return result;
}

const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp"]);
const DOCUMENT_TYPES = ["passport", "proof_of_address", "selfie", "other"] as const;
type DocumentType = (typeof DOCUMENT_TYPES)[number];

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
  if (!DOCUMENT_TYPES.includes(type as DocumentType)) {
    return { ok: false, error: "Invalid document type" };
  }

  // Store under a random pathname in the private Blob store; the DB row's
  // blobUrl holds the pathname, and reads go through the authenticated
  // /kyc/documents/[documentId] route.
  const pathname = `kyc/${caseId}/${crypto.randomUUID()}`;
  let blobPathname: string;
  try {
    const blob = await put(pathname, file, {
      access: "private",
      contentType: file.type,
    });
    blobPathname = blob.pathname;
  } catch (error) {
    console.error("Blob upload failed", error);
    return { ok: false, error: "Document storage is unavailable. Try again later." };
  }

  const result = await toActionResult(
    uploadDocument(context, {
      caseId,
      type: type as DocumentType,
      blobUrl: blobPathname,
    }),
  );
  revalidate(caseId);
  return result;
}
