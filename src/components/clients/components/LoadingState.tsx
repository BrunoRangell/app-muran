
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const LoadingState = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      <Card className="p-4 md:p-6">
        {/* Filters Skeleton */}
        <div className="mb-4 flex flex-wrap gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>

        {/* Table Skeleton */}
        <div className="border rounded-lg">
          <div className="grid grid-cols-5 gap-4 p-4 bg-gray-50 border-b">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-4 w-24" />
            ))}
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="grid grid-cols-5 gap-4 p-4 border-b">
              {[...Array(5)].map((_, j) => (
                <Skeleton key={j} className="h-4 w-full" />
              ))}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
