import type { Actor } from "@repo/core";

// Demo personas standing in for Clerk users until auth is wired.
// IDs match the seeded rows in the platform `users` table.
export interface Persona extends Actor {
  name: string;
  title: string;
}

export const personas: Persona[] = [
  { id: "user-admin", name: "Alex Admin", title: "Platform admin", roles: ["admin"] },
  { id: "user-kyc-op", name: "Kim Onboard", title: "KYC analyst", roles: ["kyc:operator"] },
  { id: "user-kyc-ap", name: "Kate Senior", title: "Senior KYC reviewer", roles: ["kyc:approver"] },
  { id: "user-ref-op", name: "Remy Support", title: "Support agent", roles: ["refunds:operator"] },
  { id: "user-ref-ap", name: "Rosa Finance", title: "Finance lead", roles: ["refunds:approver"] },
  { id: "user-flag-op", name: "Finn Dev", title: "Engineer", roles: ["flags:operator"] },
  { id: "user-flag-ap", name: "Faye Lead", title: "Engineering lead", roles: ["flags:approver"] },
];

export const DEFAULT_PERSONA_ID = "user-admin";

export function findPersona(id: string | undefined): Persona {
  const found = personas.find((p) => p.id === id);
  if (found) return found;
  const fallback = personas.find((p) => p.id === DEFAULT_PERSONA_ID);
  if (!fallback) throw new Error("Default persona missing");
  return fallback;
}
