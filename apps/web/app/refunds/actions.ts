"use server";

import { revalidatePath } from "next/cache";

import {
  decideRefund,
  refundsAppMeta,
  requestRefund,
  searchRefundableTransactions,
  type RefundableTransaction,
} from "@repo/app-refunds";
import { hasRole, type ActionResult } from "@repo/core";

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
    await requestRefund(context, { transactionId, amount, reason });
    result = { ok: true };
  } catch (err) {
    result = toError(err);
  }
  revalidatePath("/refunds");
  return result;
}

export async function searchTransactionsAction(query: string): Promise<RefundableTransaction[]> {
  const { db, actor } = await ctx();
  if (!hasRole(actor, refundsAppMeta.requiredRole)) return [];
  return searchRefundableTransactions(db, query);
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
