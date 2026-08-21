"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  ALL_ROLES,
  defineAction,
  setConfig,
  toActionResult,
  type ActionResult,
  type Role,
} from "@repo/core";

import { getActor } from "@/lib/actor";
import { getDb } from "@/lib/db";

const roleSchema = z.enum(ALL_ROLES as [Role, ...Role[]]);

const setUserRoles = defineAction({
  role: "admin",
  input: z.object({
    clerkUserId: z.string().min(1),
    actorId: z.string().min(1),
    roles: z.array(roleSchema),
  }),
  audit: (input) => ({
    action: "admin.set_user_roles",
    entityType: "user",
    entityId: input.actorId,
    after: { roles: input.roles },
  }),
  handler: async (ctx, input) => {
    if (input.actorId === ctx.actor.id && !input.roles.includes("admin")) {
      throw new Error("You cannot remove your own admin role");
    }
    const client = await clerkClient();
    await client.users.updateUserMetadata(input.clerkUserId, {
      publicMetadata: { roles: input.roles },
    });
  },
});

const updateConfig = defineAction({
  role: "admin",
  input: z.object({
    key: z.string().min(1),
    valueJson: z.string().min(1),
  }),
  audit: (input) => ({
    action: "admin.update_config",
    entityType: "app_config",
    entityId: input.key,
    after: { value: JSON.parse(input.valueJson) as unknown },
  }),
  handler: async (ctx, input) => {
    let value: unknown;
    try {
      value = JSON.parse(input.valueJson);
    } catch {
      throw new Error('Value must be valid JSON (e.g. 100000, "text", true)');
    }
    await setConfig(ctx.db, input.key, value, ctx.actor.id);
  },
});

async function ctx() {
  return { db: getDb(), actor: await getActor() };
}

export async function setUserRolesAction(
  clerkUserId: string,
  actorId: string,
  roles: Role[],
): Promise<ActionResult> {
  const result = await toActionResult(setUserRoles(await ctx(), { clerkUserId, actorId, roles }));
  revalidatePath("/admin");
  return result;
}

export async function updateConfigAction(key: string, valueJson: string): Promise<ActionResult> {
  const result = await toActionResult(updateConfig(await ctx(), { key, valueJson }));
  revalidatePath("/admin");
  return result;
}
