import { clerkClient } from "@clerk/nextjs/server";

import type { Role } from "@repo/core";

// Demo default: new users get every capability so anyone who signs up can use
// the app without waiting for an admin. Tighten to e.g. [] or an operator
// role before real usage.
export const DEFAULT_ROLES: Role[] = ["admin"];

export async function assignDefaultRoles(clerkUserId: string): Promise<Role[]> {
  const client = await clerkClient();
  await client.users.updateUserMetadata(clerkUserId, {
    publicMetadata: { roles: DEFAULT_ROLES },
  });
  return DEFAULT_ROLES;
}
