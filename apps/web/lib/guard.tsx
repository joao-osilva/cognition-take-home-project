import { Lock } from "lucide-react";

import { hasRole, type Actor, type Role } from "@repo/core";
import { EmptyState } from "@repo/ui";

export function NoAccess() {
  return (
    <EmptyState
      icon={<Lock />}
      title="Your role does not have access to this app"
      hint="Ask an admin to assign you a role in the Admin console."
      className="mt-8"
    />
  );
}

export function canView(actor: Actor, role: Role): boolean {
  return hasRole(actor, role);
}
