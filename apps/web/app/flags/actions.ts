"use server";

import { revalidatePath } from "next/cache";

import {
  archiveFlag,
  createFlag,
  decideFlagChange,
  restoreFlag,
  setFlagState,
} from "@repo/app-flags";
import { toActionResult, type ActionResult } from "@repo/core";

import { getActor } from "@/lib/actor";
import { getDb } from "@/lib/db";

async function ctx() {
  return { db: getDb(), actor: await getActor() };
}

export async function setFlagStateAction(
  flagId: string,
  state: "on" | "off" | "percentage",
  rolloutPercentage?: number,
): Promise<ActionResult> {
  const result = await toActionResult(
    setFlagState(await ctx(), { flagId, state, rolloutPercentage }),
  );
  revalidatePath("/flags");
  return result;
}

export async function createFlagAction(key: string, description: string): Promise<ActionResult> {
  const result = await toActionResult(createFlag(await ctx(), { key, description }));
  revalidatePath("/flags");
  return result;
}

export async function archiveFlagAction(key: string): Promise<ActionResult> {
  const result = await toActionResult(archiveFlag(await ctx(), { key }));
  revalidatePath("/flags");
  return result;
}

export async function restoreFlagAction(key: string): Promise<ActionResult> {
  const result = await toActionResult(restoreFlag(await ctx(), { key }));
  revalidatePath("/flags");
  return result;
}

export async function decideFlagChangeAction(
  approvalId: string,
  decision: "approved" | "rejected",
  reason: string,
): Promise<ActionResult> {
  const result = await toActionResult(
    decideFlagChange(await ctx(), { approvalId, decision, reason }),
  );
  revalidatePath("/flags");
  return result;
}
