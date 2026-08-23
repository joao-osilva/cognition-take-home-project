"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { defineAction, markNotificationsRead, toActionResult, type ActionResult } from "@repo/core";

import { getActor } from "@/lib/actor";
import { getDb } from "@/lib/db";

const markRead = defineAction({
  input: z.object({ ids: z.array(z.string().uuid()).optional() }),
  audit: (input) => ({
    action: "notifications.mark_read",
    entityType: "notification",
    entityId: input.ids?.join(",") ?? "all",
  }),
  handler: async (ctx, input) => {
    await markNotificationsRead(ctx.db, ctx.actor.id, input.ids);
  },
});

export async function markNotificationsReadAction(ids?: string[]): Promise<ActionResult> {
  const actor = await getActor();
  const result = await toActionResult(markRead({ db: getDb(), actor }, { ids }));
  revalidatePath("/", "layout");
  return result;
}
