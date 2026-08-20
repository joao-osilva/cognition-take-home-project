"use client";

import { useTransition } from "react";

import type { ActionResult } from "@repo/core";
import { Switch, toast } from "@repo/ui";

export function FlagCell({
  flagId,
  environment,
  state,
  rolloutPercentage,
  disabled,
  onToggle,
}: {
  flagId: string;
  environment: "dev" | "staging" | "prod";
  state: string;
  rolloutPercentage: number | null;
  disabled: boolean;
  onToggle: (flagId: string, state: "on" | "off") => Promise<ActionResult>;
}) {
  const [pending, startTransition] = useTransition();

  const toggle = (checked: boolean) =>
    startTransition(async () => {
      const result = await onToggle(flagId, checked ? "on" : "off");
      if (!result.ok) {
        toast.error(result.error);
      } else if (environment === "prod") {
        toast.info("Change submitted for approval");
      } else {
        toast.success(`Flag turned ${checked ? "on" : "off"} in ${environment}`);
      }
    });

  return (
    <div className="flex items-center gap-2">
      <Switch checked={state === "on"} disabled={disabled || pending} onCheckedChange={toggle} />
      {state === "percentage" && rolloutPercentage != null ? (
        <span className="text-muted-foreground text-xs tabular-nums">{rolloutPercentage}%</span>
      ) : null}
    </div>
  );
}
