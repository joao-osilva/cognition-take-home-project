"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@repo/ui";

export function Pagination({
  page,
  totalPages,
  total,
  noun = "item",
  nounPlural = `${noun}s`,
  paramName = "page",
}: {
  page: number;
  totalPages: number;
  total: number;
  noun?: string;
  nounPlural?: string;
  paramName?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function go(target: number) {
    const params = new URLSearchParams(searchParams);
    if (target <= 1) params.delete(paramName);
    else params.set(paramName, String(target));
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="mt-3 flex items-center justify-between">
      <span className="text-muted-foreground text-xs">
        {total} {total === 1 ? noun : nounPlural} · page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => go(page - 1)}>
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => go(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
