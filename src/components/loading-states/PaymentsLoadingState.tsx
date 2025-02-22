
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function PaymentsLoadingState() {
  return (
    <div className="max-w-7xl mx-auto space-y-4 p-4 md:p-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
      </div>

      {/* Lista de Pagamentos */}
      <Card className="p-4 space-y-4">
        {/* Quick Filters */}
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-9 w-24" />
          ))}
        </div>

        {/* Search */}
        <Skeleton className="h-10 w-full" />

        {/* Table */}
        <div className="border rounded-lg">
          <div className="bg-gray-50 p-4 border-b grid grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-4 w-24" />
            ))}
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 border-b grid grid-cols-5 gap-4">
              {[...Array(5)].map((_, j) => (
                <Skeleton key={j} className="h-4 w-full" />
              ))}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
