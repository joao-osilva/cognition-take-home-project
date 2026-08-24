import { formatDateTime } from "./format-date";

export interface AuditTrailEntry {
  id: string;
  actorId: string;
  action: string;
  createdAt: Date;
  metadata?: unknown;
}

export function AuditTrail({ entries }: { entries: AuditTrailEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-muted-foreground text-sm">No activity yet.</p>;
  }
  return (
    <ol className="relative space-y-4 before:absolute before:inset-y-1 before:left-[3px] before:w-px before:bg-border">
      {entries.map((e) => {
        const reason =
          e.metadata && typeof e.metadata === "object" && "reason" in e.metadata
            ? String((e.metadata as { reason?: unknown }).reason ?? "")
            : "";
        return (
          <li key={e.id} className="relative flex gap-3 pl-4 text-sm">
            <span className="border-primary bg-background absolute top-1.5 left-0 size-[7px] rounded-full border-2" />
            <span className="min-w-0">
              <span className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs font-medium">
                {e.action}
              </span>
              <span className="text-muted-foreground"> by {e.actorId}</span>
              {reason ? <span className="text-muted-foreground"> — “{reason}”</span> : null}
              <span className="text-muted-foreground mt-0.5 block text-xs">
                {formatDateTime(e.createdAt)}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
