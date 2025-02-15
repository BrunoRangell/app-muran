
import { FinancialMetrics } from "@/components/clients/FinancialMetrics";
import { CostFilters } from "@/types/cost";
import { useState, Suspense } from "react";
import { DateFilter } from "@/components/costs/filters/DateFilter";
import { BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const FinancialReport = () => {
  const [filters, setFilters] = useState<CostFilters>({});

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold text-muran-dark flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-muran-primary" />
            Relatório Financeiro
          </h1>
          <p className="text-gray-600">
            Acompanhe os principais indicadores financeiros da Muran Digital
          </p>
        </div>

        <div className="w-full md:w-auto">
          <DateFilter filters={filters} onFiltersChange={setFilters} />
        </div>
      </div>

      <Card className="p-4 md:p-6">
        <Suspense fallback={<MetricsSkeleton />}>
          <FinancialMetrics />
        </Suspense>
      </Card>
    </div>
  );
};

const MetricsSkeleton = () => (
  <div className="space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="p-4 space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-full" />
        </Card>
      ))}
    </div>
    <Skeleton className="h-[400px] w-full" />
  </div>
);

export default FinancialReport;
