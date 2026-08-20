"use client";

import { useRef } from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui";

const STATUSES = ["pending", "in_review", "escalated", "approved", "rejected"];
const RISK_LEVELS = ["low", "medium", "high"];
const ALL = "all";

export function KycFilterBar({ status, riskLevel }: { status?: string; riskLevel?: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const submit = () => setTimeout(() => formRef.current?.requestSubmit(), 0);

  return (
    <form ref={formRef} method="get" className="mb-4 flex gap-3">
      <Select name="status" defaultValue={status ?? ALL} onValueChange={submit}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All statuses</SelectItem>
          {STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {s.replaceAll("_", " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select name="risk" defaultValue={riskLevel ?? ALL} onValueChange={submit}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Risk" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All risk</SelectItem>
          {RISK_LEVELS.map((r) => (
            <SelectItem key={r} value={r}>
              {r}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </form>
  );
}
