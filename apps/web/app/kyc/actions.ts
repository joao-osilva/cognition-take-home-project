"use server";

import { revalidatePath } from "next/cache";

import { claimCase, decideCase, escalateCase } from "@repo/app-kyc";
import { toActionResult, type ActionResult } from "@repo/core";

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
