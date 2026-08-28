"use client";

import { useRef } from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui";

import type { RefundRequester } from "../queries";

const STATUSES = ["pending_approval", "approved", "processed", "rejected"];
const ALL = "all";

export function RefundsFilterBar({
  status,
  requestedBy,
  requesters,
}: {
  status?: string;
  requestedBy?: string;
  requesters: RefundRequester[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const submit = () => setTimeout(() => formRef.current?.requestSubmit(), 0);

  return (
    <form ref={formRef} method="get" className="mb-4 flex gap-3">
      <Select name="status" defaultValue={status ?? ALL} onValueChange={submit}>
        <SelectTrigger className="w-44" aria-label="Filter by status">
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
      <Select name="requester" defaultValue={requestedBy ?? ALL} onValueChange={submit}>
        <SelectTrigger className="w-48" aria-label="Filter by requester">
          <SelectValue placeholder="Requested by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All requesters</SelectItem>
          {requesters.map((r) => (
            <SelectItem key={r.id} value={r.id}>
              {r.name ?? r.id}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </form>
  );
}
