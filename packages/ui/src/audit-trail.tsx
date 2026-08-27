import { formatDateTime } from "./format-date";

export interface AuditTrailEntry {
  id: string;
  actorId: string;
  actorName?: string | null;
  action: string;
  actionLabel?: string;
  createdAt: Date;
  metadata?: unknown;
}

export function AuditTrail({ entries }: { entries: AuditTrailEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-muted-foreground text-sm">No activity yet.</p>;
  }
  return (
    <ol className="relative space-y-5 before:absolute before:inset-y-1 before:left-[3px] before:w-px before:bg-border">
      {entries.map((e) => {
        const reason =
          e.metadata && typeof e.metadata === "object" && "reason" in e.metadata
            ? String((e.metadata as { reason?: unknown }).reason ?? "")
            : "";
        return (
          <li key={e.id} className="relative flex gap-3 pl-4 text-sm">
            <span className="border-primary bg-background absolute top-1.5 left-0 size-[7px] rounded-full border-2" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-1.5">
                <span className="font-medium">{e.actionLabel ?? e.action}</span>
                <span className="text-muted-foreground">
                  by {e.actorName?.trim() ? e.actorName : e.actorId}
                </span>
              </div>
              {reason ? (
                <p className="text-muted-foreground mt-0.5 break-words">“{reason}”</p>
              ) : null}
              <time
                dateTime={e.createdAt.toISOString()}
                className="text-muted-foreground mt-0.5 block font-mono text-xs tabular-nums"
              >
                {formatDateTime(e.createdAt)}
              </time>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
