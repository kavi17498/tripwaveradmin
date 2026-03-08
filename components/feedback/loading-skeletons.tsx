import { Skeleton } from "@/components/ui/skeleton";

export function CardSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="border border-border p-4">
          <Skeleton className="h-44 w-full" />
          <Skeleton className="mt-4 h-5 w-2/3" />
          <Skeleton className="mt-2 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-4/5" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex gap-3 border border-border p-3">
          <Skeleton className="h-5 w-1/4" />
          <Skeleton className="h-5 w-1/5" />
          <Skeleton className="h-5 w-1/4" />
          <Skeleton className="h-5 w-1/6" />
        </div>
      ))}
    </div>
  );
}
