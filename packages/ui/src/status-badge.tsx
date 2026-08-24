import { cn } from "@repo/ui/lib/utils";

type Tone = "success" | "warning" | "danger" | "info" | "neutral" | "accent";

const TONE_CLASSES: Record<Tone, { pill: string; dot: string }> = {
  success: {
    pill: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-900",
    dot: "bg-emerald-500",
  },
  warning: {
    pill: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-900",
    dot: "bg-amber-500",
  },
  danger: {
    pill: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-400 dark:border-red-900",
    dot: "bg-red-500",
  },
  info: {
    pill: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-900",
    dot: "bg-blue-500",
  },
  neutral: {
    pill: "bg-zinc-50 text-zinc-600 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800",
    dot: "bg-zinc-400",
  },
  accent: {
    pill: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-400 dark:border-indigo-900",
    dot: "bg-indigo-500",
  },
};

const STATUS_TONES: Record<string, Tone> = {
  pending: "warning",
  requested: "warning",
  in_review: "info",
  escalated: "danger",
  pending_approval: "warning",
  approved: "success",
  processed: "success",
  settled: "success",
  on: "success",
  rejected: "danger",
  off: "neutral",
  percentage: "accent",
  low: "neutral",
  medium: "warning",
  high: "danger",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const tone = TONE_CLASSES[STATUS_TONES[status] ?? "neutral"];
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium capitalize",
        tone.pill,
        className,
      )}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", tone.dot)} />
      {status.replaceAll("_", " ")}
    </span>
  );
}
