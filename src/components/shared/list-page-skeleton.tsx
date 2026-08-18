import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function ListPageSkeleton({ statCards = 4 }: { statCards?: number }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: statCards }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
            <div className="flex items-start justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="size-9 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
      <Skeleton className="h-10 w-full max-w-xs" />
      <Card className="flex flex-col gap-3 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </Card>
    </div>
  );
}
