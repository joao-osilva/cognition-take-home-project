"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(current.q ?? "");

  function apply(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  const hasFilters = Boolean(current.actor || current.entity || current.q);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          apply({ q: search || undefined });
        }}
      >
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search action or entity ID…"
          className="w-64"
        />
        <Button type="submit" variant="secondary" size="sm" className="h-9">
          Search
        </Button>
      </form>
      <Select
        value={current.actor ?? ALL}
        onValueChange={(value) => apply({ actor: value === ALL ? undefined : value })}
      >
        <SelectTrigger className="w-48">
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
        <SelectTrigger className="w-48">
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
      {hasFilters ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSearch("");
            apply({ q: undefined, actor: undefined, entity: undefined });
          }}
        >
          Clear
        </Button>
      ) : null}
    </div>
  );
}
