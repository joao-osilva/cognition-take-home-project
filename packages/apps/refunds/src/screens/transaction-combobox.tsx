"use client";

import { useEffect, useState } from "react";

import {
  Button,
  CheckIcon,
  ChevronsUpDownIcon,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
  cn,
  formatMoney,
} from "@repo/ui";

import type { RefundableTransaction } from "../queries";

export function TransactionCombobox({
  selected,
  onSelect,
  onSearch,
}: {
  selected: RefundableTransaction | null;
  onSelect: (transaction: RefundableTransaction | null) => void;
  onSearch: (query: string) => Promise<RefundableTransaction[]>;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RefundableTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      const found = await onSearch(query);
      if (!cancelled) {
        setResults(found);
        setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, query, onSearch]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between font-normal"
        >
          {selected
            ? `${selected.customerName} — ${formatMoney(selected.amount, selected.currency)}`
            : "Search settled transactions…"}
          <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Customer name or transaction ID…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>{loading ? "Searching…" : "No settled transactions found."}</CommandEmpty>
            <CommandGroup>
              {results.map((t) => (
                <CommandItem
                  key={t.id}
                  value={t.id}
                  onSelect={() => {
                    onSelect(t.id === selected?.id ? null : t);
                    setOpen(false);
                  }}
                >
                  <CheckIcon
                    className={cn(
                      "mr-2 size-4",
                      selected?.id === t.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="flex-1 truncate">{t.customerName}</span>
                  <span className="text-muted-foreground font-mono text-xs">
                    {formatMoney(t.amount, t.currency)}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
