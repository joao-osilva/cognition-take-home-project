"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { PERSONA_COOKIE } from "@/lib/actor";
import { findPersona } from "@/lib/personas";

export async function switchPersona(personaId: string) {
  const persona = findPersona(personaId);
  const store = await cookies();
  store.set(PERSONA_COOKIE, persona.id, { path: "/" });
  revalidatePath("/", "layout");
}
