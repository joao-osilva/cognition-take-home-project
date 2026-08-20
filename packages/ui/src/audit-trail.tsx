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
    <ol className="space-y-3">
      {entries.map((e) => {
        const reason =
          e.metadata && typeof e.metadata === "object" && "reason" in e.metadata
            ? String((e.metadata as { reason?: unknown }).reason ?? "")
            : "";
        return (
          <li key={e.id} className="flex gap-3 text-sm">
            <span className="bg-border mt-1.5 size-2 shrink-0 rounded-full" />
            <span className="min-w-0">
              <span className="font-medium">{e.action}</span>
              <span className="text-muted-foreground"> by {e.actorId}</span>
              {reason ? <span className="text-muted-foreground"> — “{reason}”</span> : null}
              <span className="text-muted-foreground block text-xs">
                {e.createdAt.toLocaleString("en-US")}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
