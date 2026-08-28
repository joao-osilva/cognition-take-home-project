"use client";

import {
  ClearFiltersButton,
  FilterSearchInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useFilterNavigation,
} from "@repo/ui";

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
  const apply = useFilterNavigation();
  const hasFilters = Boolean(status || requestedBy || customer);

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <FilterSearchInput
        paramName="customer"
        value={customer}
        placeholder="Search customer…"
        ariaLabel="Search by customer name"
      />
      <Select
        value={status ?? ALL}
        onValueChange={(value) => apply({ status: value === ALL ? undefined : value })}
      >
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
      <Select
        value={requestedBy ?? ALL}
        onValueChange={(value) => apply({ requester: value === ALL ? undefined : value })}
      >
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
      {hasFilters ? <ClearFiltersButton params={["customer", "status", "requester"]} /> : null}
    </div>
  );
}
