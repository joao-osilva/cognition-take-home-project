import { currentUser } from "@clerk/nextjs/server";
import { cache } from "react";

import { isRole, upsertUser, type Actor } from "@repo/core";

import { getDb } from "@/lib/db";

export interface SessionUser extends Actor {
  name: string;
  email: string;
}

// The acting user comes from the Clerk session; roles live in Clerk
// publicMetadata.roles. The platform `users` mirror is kept fresh on read so
// local dev works without webhook delivery (the Clerk webhook is the
// authoritative sync in deployed environments).
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const user = await currentUser();
  if (!user) return null;

  const rawRoles = user.publicMetadata["roles"];
  const roles = Array.isArray(rawRoles) ? rawRoles.filter(isRole) : [];
  const id = user.externalId ?? user.id;
  const email = user.primaryEmailAddress?.emailAddress ?? "";
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || email;

  await upsertUser(getDb(), { id, email, name });
  return { id, roles, name, email };
});

export async function getActor(): Promise<Actor> {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated");
  return { id: user.id, roles: user.roles };
}
