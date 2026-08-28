import { Skeleton } from "@repo/ui";

export default function Loading() {
  return (
    <div>
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
        <div className="flex shrink-0 flex-col gap-2 lg:w-56">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-[32rem] flex-1 rounded-lg" />
      </div>
    </div>
  );
}
