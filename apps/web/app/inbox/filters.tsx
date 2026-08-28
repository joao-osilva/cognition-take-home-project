"use client";

import {
  ClearFiltersButton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useFilterNavigation,
} from "@repo/ui";

const ALL = "__all__";

export function InboxFilters({
  types,
  current,
}: {
  types: { value: string; label: string }[];
  current: { status?: string; type?: string };
}) {
  const apply = useFilterNavigation();
  const hasFilters = Boolean(current.status || current.type);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={current.status ?? ALL}
        onValueChange={(value) => apply({ status: value === ALL ? undefined : value })}
      >
        <SelectTrigger className="w-40" aria-label="Filter by status">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All</SelectItem>
          <SelectItem value="unread">Unread</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={current.type ?? ALL}
        onValueChange={(value) => apply({ type: value === ALL ? undefined : value })}
      >
        <SelectTrigger className="w-56" aria-label="Filter by type">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All types</SelectItem>
          {types.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hasFilters ? <ClearFiltersButton params={["status", "type"]} /> : null}
    </div>
  );
}
