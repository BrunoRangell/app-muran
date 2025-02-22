
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function DashboardLoadingState() {
  return (
    <div className="max-w-7xl mx-auto space-y-4 p-4 md:p-6 animate-fade-in">
      {/* Header com avatar */}
      <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>

      {/* Cards em grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1">
          <Card className="p-4 space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-4 w-24" />
          </Card>
        </div>
        <div className="lg:col-span-3">
          <Card className="p-4 space-y-4">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-32 w-full" />
          </Card>
        </div>
      </div>

      {/* Cards inferiores */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4 space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-24 w-full" />
          </Card>
        ))}
      </div>
    </div>
  );
}
