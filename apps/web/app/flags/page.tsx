import { flagsAppMeta, listFlagGroups } from "@repo/app-flags";
import { FlagsScreen } from "@repo/app-flags/screens";
import { hasRole } from "@repo/core";

import { getActor } from "@/lib/actor";
import { getDb } from "@/lib/db";
import { canView, NoAccess } from "@/lib/guard";

import { decideFlagChangeAction, setFlagStateAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function FlagsPage() {
  const actor = await getActor();
  if (!canView(actor, flagsAppMeta.requiredRole)) return <NoAccess />;

  const groups = await listFlagGroups(getDb());

  return (
    <FlagsScreen
      groups={groups}
      canToggle={hasRole(actor, "flags:operator")}
      canApprove={hasRole(actor, "flags:approver")}
      onToggle={setFlagStateAction}
      onDecide={decideFlagChangeAction}
    />
  );
}
