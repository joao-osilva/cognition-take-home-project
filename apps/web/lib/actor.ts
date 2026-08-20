import type { Actor } from "@repo/core";

// Placeholder until Clerk is wired: a demo actor holding every role.
// Will become: read Clerk session -> publicMetadata.roles.
export async function getActor(): Promise<Actor> {
  return {
    id: "demo-user",
    roles: ["admin"],
  };
}
