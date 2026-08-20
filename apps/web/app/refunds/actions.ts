"use server";

import { revalidatePath } from "next/cache";

import { decideRefund, requestRefund } from "@repo/app-refunds";
import { toActionResult, type ActionResult } from "@repo/core";

import { getActor } from "@/lib/actor";
import { getDb } from "@/lib/db";

async function ctx() {
  return { db: getDb(), actor: await getActor() };
}

export async function requestRefundAction(
  transactionId: string,
  amount: number,
  reason: string,
): Promise<ActionResult> {
  const result = await toActionResult(
    requestRefund(await ctx(), { transactionId, amount, reason }),
  );
  revalidatePath("/refunds");
  return result;
}

export async function decideRefundAction(
  approvalId: string,
  decision: "approved" | "rejected",
  reason: string,
): Promise<ActionResult> {
  const result = await toActionResult(decideRefund(await ctx(), { approvalId, decision, reason }));
  revalidatePath("/refunds");
  return result;
}
