
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CostFilters, Cost } from "@/types/cost";
import { NewCostDialog } from "@/components/costs/NewCostDialog";
import { EditCostDialog } from "@/components/costs/EditCostDialog";
import { Toaster } from "@/components/ui/toaster";
import { CostsPageHeader } from "@/components/costs/enhanced/CostsPageHeader";
import { CostsMetricsGrid } from "@/components/costs/enhanced/CostsMetricsGrid";
import { SmartFiltersBar } from "@/components/costs/enhanced/SmartFiltersBar";
import { EnhancedCostsTable } from "@/components/costs/enhanced/EnhancedCostsTable";
import { CostsVisualization } from "@/components/costs/enhanced/CostsVisualization";
import { DateFilter } from "@/components/costs/filters/DateFilter";

export default function Costs() {
  const [isNewCostOpen, setIsNewCostOpen] = useState(false);
  const [selectedCost, setSelectedCost] = useState<Cost | null>(null);
  const [filters, setFilters] = useState<CostFilters>({});

  const { data: costs, isLoading } = useQuery({
    queryKey: ["costs", filters],
    queryFn: async () => {
      console.log('Buscando custos com filtros:', filters);
      
      let query = supabase
        .from("costs")
        .select("*, costs_categories(category_id)")
        .order("date", { ascending: false });

      if (filters.startDate) {
        query = query.gte("date", filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte("date", filters.endDate);
      }
      if (filters.categories && filters.categories.length > 0) {
        query = query.in("costs_categories.category_id", filters.categories);
      }
      if (filters.search) {
        query = query.ilike("name", `%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Erro ao buscar custos:", error);
        throw error;
      }

      const processedData = data.map(cost => ({
        ...cost,
        categories: cost.costs_categories.map((cc: any) => cc.category_id)
      }));

      console.log('Custos retornados:', processedData);
      return processedData;
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header padronizado */}
        <div className="mb-6">
          <CostsPageHeader onNewCostClick={() => setIsNewCostOpen(true)} />
        </div>

        {/* Métricas em grid */}
        <div className="mb-6">
          <CostsMetricsGrid costs={costs || []} />
        </div>

        {/* Filtros inteligentes */}
        <div className="mb-6">
          <SmartFiltersBar filters={filters} onFiltersChange={setFilters} />
        </div>

        {/* Visualizações (gráficos) */}
        <div className="mb-6">
          <CostsVisualization costs={costs || []} filters={filters} />
        </div>

        {/* Tabela aprimorada */}
        <div className="mb-6">
          <EnhancedCostsTable 
            costs={costs || []} 
            isLoading={isLoading} 
            onEditClick={setSelectedCost}
          />
        </div>

        {/* Diálogos */}
        <NewCostDialog
          open={isNewCostOpen}
          onOpenChange={setIsNewCostOpen}
        />

        <EditCostDialog 
          cost={selectedCost}
          open={!!selectedCost}
          onOpenChange={(open) => !open && setSelectedCost(null)}
        />

        <Toaster />
      </div>
    </div>
  );
}
