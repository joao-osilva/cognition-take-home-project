"use client";

import { useEffect, useRef } from "react";

import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui";

import type { RefundRequester } from "../queries";

const STATUSES = ["pending_approval", "approved", "processed", "rejected"];
const ALL = "all";

export function RefundsFilterBar({
  status,
  requestedBy,
  customer,
  requesters,
}: {
  status?: string;
  requestedBy?: string;
  customer?: string;
  requesters: RefundRequester[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submit = () => setTimeout(() => formRef.current?.requestSubmit(), 0);
  const debouncedSubmit = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => formRef.current?.requestSubmit(), 400);
  };
  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  return (
    <form ref={formRef} method="get" className="mb-4 flex flex-wrap gap-3">
      <Input
        type="search"
        name="customer"
        defaultValue={customer ?? ""}
        placeholder="Search customer…"
        aria-label="Search by customer name"
        autoComplete="off"
        spellCheck={false}
        className="w-56"
        onChange={debouncedSubmit}
      />
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
