import { cookies } from "next/headers";

import type { Actor } from "@repo/core";

import { findPersona, type Persona } from "@/lib/personas";

export const PERSONA_COOKIE = "demo_persona";

// Placeholder until Clerk is wired: the acting user is a demo persona chosen
// in the shell. Will become: read Clerk session -> publicMetadata.roles.
export async function getPersona(): Promise<Persona> {
  const store = await cookies();
  return findPersona(store.get(PERSONA_COOKIE)?.value);
}

export async function getActor(): Promise<Actor> {
  const { id, roles } = await getPersona();
  return { id, roles };
}
