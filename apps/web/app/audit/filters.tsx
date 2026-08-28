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

const ALL = "__all__";

export function AuditFilters({
  actors,
  entityTypes,
  current,
}: {
  actors: { id: string; name: string }[];
  entityTypes: string[];
  current: { actor?: string; entity?: string; q?: string };
}) {
  const apply = useFilterNavigation();
  const hasFilters = Boolean(current.actor || current.entity || current.q);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterSearchInput
        value={current.q}
        placeholder="Search action or entity ID…"
        ariaLabel="Search by action or entity ID"
        className="w-64"
      />
      <Select
        value={current.actor ?? ALL}
        onValueChange={(value) => apply({ actor: value === ALL ? undefined : value })}
      >
        <SelectTrigger className="w-48" aria-label="Filter by actor">
          <SelectValue placeholder="Actor" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All actors</SelectItem>
          {actors.map((actor) => (
            <SelectItem key={actor.id} value={actor.id}>
              {actor.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={current.entity ?? ALL}
        onValueChange={(value) => apply({ entity: value === ALL ? undefined : value })}
      >
        <SelectTrigger className="w-48" aria-label="Filter by entity type">
          <SelectValue placeholder="Entity type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All entity types</SelectItem>
          {entityTypes.map((type) => (
            <SelectItem key={type} value={type}>
              {type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hasFilters ? <ClearFiltersButton params={["q", "actor", "entity"]} /> : null}
    </div>
  );
}
