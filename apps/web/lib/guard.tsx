import { hasRole, type Actor, type Role } from "@repo/core";

export function NoAccess() {
  return (
    <p className="text-muted-foreground text-sm">
      Your role does not have access to this app. Switch persona in the sidebar to explore.
    </p>
  );
}

export function canView(actor: Actor, role: Role): boolean {
  return hasRole(actor, role);
}
