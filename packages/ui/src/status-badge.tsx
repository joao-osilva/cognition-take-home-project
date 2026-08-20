import { Badge } from "@repo/ui/components/badge";
import { cn } from "@repo/ui/lib/utils";

const TONES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-900 border-amber-200",
  in_review: "bg-blue-100 text-blue-900 border-blue-200",
  escalated: "bg-orange-100 text-orange-900 border-orange-200",
  approved: "bg-emerald-100 text-emerald-900 border-emerald-200",
  processed: "bg-emerald-100 text-emerald-900 border-emerald-200",
  on: "bg-emerald-100 text-emerald-900 border-emerald-200",
  rejected: "bg-red-100 text-red-900 border-red-200",
  off: "bg-zinc-100 text-zinc-700 border-zinc-200",
  requested: "bg-amber-100 text-amber-900 border-amber-200",
  pending_approval: "bg-orange-100 text-orange-900 border-orange-200",
  percentage: "bg-violet-100 text-violet-900 border-violet-200",
  low: "bg-emerald-100 text-emerald-900 border-emerald-200",
  medium: "bg-amber-100 text-amber-900 border-amber-200",
  high: "bg-red-100 text-red-900 border-red-200",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn("font-medium capitalize", TONES[status])}>
      {status.replaceAll("_", " ")}
    </Badge>
  );
}
