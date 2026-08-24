import type { ReactNode } from "react";

import { cn } from "@repo/ui/lib/utils";

export function EmptyState({
  icon,
  title,
  hint,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-12 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="bg-muted text-muted-foreground mb-1 flex size-10 items-center justify-center rounded-full [&_svg]:size-5">
          {icon}
        </div>
      ) : null}
      <p className="text-sm font-medium">{title}</p>
      {hint ? <p className="text-muted-foreground max-w-sm text-sm">{hint}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
