import { clerkClient } from "@clerk/nextjs/server";

import { isRole, type Role } from "@repo/core";

export interface AdminUserRow {
  clerkUserId: string;
  actorId: string;
  name: string;
  email: string;
  roles: Role[];
}

export async function listClerkUsers(): Promise<AdminUserRow[]> {
  const client = await clerkClient();
  const { data } = await client.users.getUserList({ limit: 200, orderBy: "-created_at" });

  return data.map((user) => {
    const rawRoles = user.publicMetadata["roles"];
    const email = user.primaryEmailAddress?.emailAddress ?? "";
    return {
      clerkUserId: user.id,
      actorId: user.externalId ?? user.id,
      name: [user.firstName, user.lastName].filter(Boolean).join(" ") || email,
      email,
      roles: Array.isArray(rawRoles) ? rawRoles.filter(isRole) : [],
    };
  });
}
