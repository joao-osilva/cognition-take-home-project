"use client";

import { ChevronsUpDown, UserRound } from "lucide-react";
import { useTransition } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui";

import type { Persona } from "@/lib/personas";
import { switchPersona } from "@/lib/switch-persona";

export function PersonaSwitcher({ personas, current }: { personas: Persona[]; current: Persona }) {
  const [, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="hover:bg-sidebar-accent/50 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left">
        <span className="bg-sidebar-accent text-sidebar-accent-foreground flex size-8 shrink-0 items-center justify-center rounded-full">
          <UserRound className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="text-sidebar-foreground block truncate text-sm font-medium">
            {current.name}
          </span>
          <span className="text-sidebar-foreground/60 block truncate text-xs">{current.title}</span>
        </span>
        <ChevronsUpDown className="text-sidebar-foreground/60 size-4 shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-56">
        <DropdownMenuLabel>Act as (demo)</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {personas.map((p) => (
          <DropdownMenuItem key={p.id} onSelect={() => startTransition(() => switchPersona(p.id))}>
            <span className="flex-1">{p.name}</span>
            <span className="text-muted-foreground text-xs">{p.title}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
