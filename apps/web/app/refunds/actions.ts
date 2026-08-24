"use server";

import { revalidatePath } from "next/cache";

import { decideRefund, requestRefund } from "@repo/app-refunds";
import { type ActionResult } from "@repo/core";

import { getActor } from "@/lib/actor";
import { getDb } from "@/lib/db";
import { sendEvent } from "@/lib/inngest";

async function ctx() {
  return { db: getDb(), actor: await getActor() };
}

function toError(err: unknown): ActionResult {
  return { ok: false, error: err instanceof Error ? err.message : "Something went wrong" };
}

export async function requestRefundAction(
  transactionId: string,
  amount: number,
  reason: string,
): Promise<ActionResult> {
  const context = await ctx();
  let result: ActionResult;
  try {
    const refund = await requestRefund(context, { transactionId, amount, reason });
    if (refund.status === "approved") {
      // Below-threshold refunds are auto-approved; hand them to settlement.
      await sendEvent("refund.approved", {
        refundId: refund.refundId,
        requestedBy: context.actor.id,
      });
    }
    result = { ok: true };
  } catch (err) {
    result = toError(err);
  }
  revalidatePath("/refunds");
  return result;
}

export async function decideRefundAction(
  approvalId: string,
  decision: "approved" | "rejected",
  reason: string,
): Promise<ActionResult> {
  const context = await ctx();
  let result: ActionResult;
  try {
    const refund = await decideRefund(context, { approvalId, decision, reason });
    if (decision === "approved") {
      await sendEvent("refund.approved", {
        refundId: refund.refundId,
        requestedBy: refund.requestedBy,
      });
    }
    result = { ok: true };
  } catch (err) {
    result = toError(err);
  }
  revalidatePath("/refunds");
  return result;
}
