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

const STATUSES = ["pending", "in_review", "escalated", "approved", "rejected"];
const RISK_LEVELS = ["low", "medium", "high"];
const ALL = "all";

export function KycFilterBar({
  status,
  riskLevel,
  customer,
}: {
  status?: string;
  riskLevel?: string;
  customer?: string;
}) {
  const apply = useFilterNavigation();
  const hasFilters = Boolean(status || riskLevel || customer);

  return (
    <div className="flex flex-wrap items-center gap-3">
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
        <SelectTrigger className="w-40" aria-label="Filter by status">
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
        value={riskLevel ?? ALL}
        onValueChange={(value) => apply({ risk: value === ALL ? undefined : value })}
      >
        <SelectTrigger className="w-36" aria-label="Filter by risk level">
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
      {hasFilters ? <ClearFiltersButton params={["customer", "status", "risk"]} /> : null}
    </div>
  );
}
