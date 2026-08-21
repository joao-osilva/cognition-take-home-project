export type Role =
  | "kyc:operator"
  | "kyc:approver"
  | "refunds:operator"
  | "refunds:approver"
  | "flags:operator"
  | "flags:approver"
  | "admin";

export const ALL_ROLES: readonly Role[] = [
  "kyc:operator",
  "kyc:approver",
  "refunds:operator",
  "refunds:approver",
  "flags:operator",
  "flags:approver",
  "admin",
];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ALL_ROLES as readonly string[]).includes(value);
}

export interface Actor {
  id: string;
  roles: Role[];
}

const ROLE_IMPLICATIONS: Partial<Record<Role, Role[]>> = {
  "kyc:approver": ["kyc:operator"],
  "refunds:approver": ["refunds:operator"],
  "flags:approver": ["flags:operator"],
};

export function hasRole(actor: Actor, role: Role): boolean {
  if (actor.roles.includes("admin")) return true;
  if (actor.roles.includes(role)) return true;
  return actor.roles.some((r) => ROLE_IMPLICATIONS[r]?.includes(role) ?? false);
}

export function requireRole(actor: Actor, role: Role): void {
  if (!hasRole(actor, role)) {
    throw new ForbiddenError(`Actor ${actor.id} lacks role ${role}`);
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}
