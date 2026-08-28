"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "./components/button";
import { Input } from "./components/input";
import { cn } from "./lib/utils";

const DEBOUNCE_MS = 400;

export function useFilterNavigation(resetParams: string[] = ["page"]) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const resetKey = resetParams.join(",");

  return useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams);
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      for (const param of resetKey.split(",")) {
        if (param) params.delete(param);
      }
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    },
    [router, pathname, searchParams, resetKey],
  );
}

export function FilterSearchInput({
  paramName = "q",
  value,
  placeholder,
  ariaLabel,
  resetParams,
  className,
}: {
  paramName?: string;
  value?: string;
  placeholder: string;
  ariaLabel: string;
  resetParams?: string[];
  className?: string;
}) {
  const apply = useFilterNavigation(resetParams);
  const [text, setText] = useState(value ?? "");
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (document.activeElement !== inputRef.current) setText(value ?? "");
  }, [value]);

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  return (
    <Input
      ref={inputRef}
      type="search"
      value={text}
      placeholder={placeholder}
      aria-label={ariaLabel}
      autoComplete="off"
      spellCheck={false}
      className={cn("w-56", className)}
      onChange={(event) => {
        const next = event.target.value;
        setText(next);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          apply({ [paramName]: next.trim() || undefined });
        }, DEBOUNCE_MS);
      }}
    />
  );
}

export function ClearFiltersButton({
  params,
  resetParams,
}: {
  params: string[];
  resetParams?: string[];
}) {
  const apply = useFilterNavigation(resetParams);
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => apply(Object.fromEntries(params.map((param) => [param, undefined])))}
    >
      Clear
    </Button>
  );
}
