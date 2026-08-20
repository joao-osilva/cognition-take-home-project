"use server";

import { revalidatePath } from "next/cache";

import { decideFlagChange, setFlagState } from "@repo/app-flags";
import { toActionResult, type ActionResult } from "@repo/core";

import { getActor } from "@/lib/actor";
import { getDb } from "@/lib/db";

async function ctx() {
  return { db: getDb(), actor: await getActor() };
}

export async function setFlagStateAction(
  flagId: string,
  state: "on" | "off",
): Promise<ActionResult> {
  const result = await toActionResult(setFlagState(await ctx(), { flagId, state }));
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
