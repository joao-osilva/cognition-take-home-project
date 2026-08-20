import type { z } from "zod";

import type { Db } from "@repo/db";

import { writeAudit, type AuditEntry } from "./audit";
import { requireRole, type Actor, type Role } from "./rbac";

export interface ActionContext {
  db: Db;
  actor: Actor;
}

export interface ActionDefinition<Schema extends z.ZodTypeAny, Result> {
  role: Role;
  input: Schema;
  audit: (input: z.infer<Schema>, result: Result) => AuditEntry;
  handler: (ctx: ActionContext, input: z.infer<Schema>) => Promise<Result>;
}

/**
 * Every mutation goes through this pipeline: auth (role check) -> validate ->
 * domain logic -> audit. It cannot be skipped by construction.
 */
export function defineAction<Schema extends z.ZodTypeAny, Result>(
  definition: ActionDefinition<Schema, Result>,
) {
  return async (ctx: ActionContext, rawInput: unknown): Promise<Result> => {
    requireRole(ctx.actor, definition.role);
    const input = definition.input.parse(rawInput);
    const result = await definition.handler(ctx, input);
    await writeAudit(ctx.db, ctx.actor, definition.audit(input, result));
    return result;
  };
}

// Shape server-action wrappers return to client components (errors as data,
// since thrown errors don't cross the server-action boundary with messages).
export type ActionResult = { ok: true } | { ok: false; error: string };

export async function toActionResult(promise: Promise<unknown>): Promise<ActionResult> {
  try {
    await promise;
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Something went wrong" };
  }
}
