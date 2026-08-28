"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { TableRow } from "@repo/ui";

export function RefundTableRow({
  refundId,
  children,
}: {
  refundId: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const open = () => {
    const params = new URLSearchParams(searchParams);
    params.set("refund", refundId);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <TableRow
      className="cursor-pointer"
      tabIndex={0}
      role="link"
      aria-label="Open refund details"
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      }}
    >
      {children}
    </TableRow>
  );
}
