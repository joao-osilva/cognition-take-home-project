"use client";

import { useState, useTransition } from "react";

import type { ActionResult } from "@repo/core";
import {
  Button,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Switch,
  toast,
} from "@repo/ui";

export function FlagCell({
  flagId,
  environment,
  state,
  rolloutPercentage,
  disabled,
  onSetState,
}: {
  flagId: string;
  environment: "dev" | "staging" | "prod";
  state: string;
  rolloutPercentage: number | null;
  disabled: boolean;
  onSetState: (
    flagId: string,
    state: "on" | "off" | "percentage",
    rolloutPercentage?: number,
  ) => Promise<ActionResult>;
}) {
  const [pending, startTransition] = useTransition();
  const [percentOpen, setPercentOpen] = useState(false);
  const [percent, setPercent] = useState(String(rolloutPercentage ?? 25));

  const apply = (next: "on" | "off" | "percentage", pct?: number) =>
    startTransition(async () => {
      const result = await onSetState(flagId, next, pct);
      if (!result.ok) {
        toast.error(result.error);
      } else if (environment === "prod") {
        toast.info("Change submitted for approval");
        setPercentOpen(false);
      } else {
        toast.success(
          next === "percentage"
            ? `Rollout set to ${pct}% in ${environment}`
            : `Flag turned ${next} in ${environment}`,
        );
        setPercentOpen(false);
      }
    });

  const submitPercent = () => {
    const value = Number(percent);
    if (!Number.isInteger(value) || value < 1 || value > 99) {
      toast.error("Enter a whole number between 1 and 99");
      return;
    }
    apply("percentage", value);
  };

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={state === "on" || state === "percentage"}
        disabled={disabled || pending}
        aria-label={`Flag state in ${environment}`}
        onCheckedChange={(checked) => apply(checked ? "on" : "off")}
      />
      <Popover open={percentOpen} onOpenChange={setPercentOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs tabular-nums"
            disabled={disabled || pending}
            aria-label={`Set percentage rollout in ${environment}`}
          >
            {state === "percentage" && rolloutPercentage != null ? `${rolloutPercentage}%` : "%"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56" align="start">
          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              submitPercent();
            }}
          >
            <div className="grid gap-1.5">
              <Label htmlFor={`rollout-${flagId}`}>Rollout percentage</Label>
              <Input
                id={`rollout-${flagId}`}
                type="number"
                min={1}
                max={99}
                inputMode="numeric"
                value={percent}
                onChange={(e) => setPercent(e.target.value)}
              />
              <p className="text-muted-foreground text-xs">
                Serve to 1–99% of traffic in {environment}.
              </p>
            </div>
            <Button type="submit" size="sm" disabled={pending}>
              Apply rollout
            </Button>
          </form>
        </PopoverContent>
      </Popover>
    </div>
  );
}
