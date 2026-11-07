
import { useState } from "react";
import { useCostsPaginated } from "@/hooks/queries/useCostsPaginated";
import { CostFilters, Cost } from "@/types/cost";
import { NewCostDialog } from "@/components/costs/NewCostDialog";
import { EditCostDialog } from "@/components/costs/EditCostDialog";
import { Toaster } from "@/components/ui/toaster";
import { CostsPageHeader } from "@/components/costs/enhanced/CostsPageHeader";
import { CostsMetricsGrid } from "@/components/costs/enhanced/CostsMetricsGrid";
import { SmartFiltersBar } from "@/components/costs/enhanced/SmartFiltersBar";
import { EnhancedCostsTable } from "@/components/costs/enhanced/EnhancedCostsTable";
import { CostsVisualization } from "@/components/costs/enhanced/CostsVisualization";
import { Button } from "@/components/ui/button";

export default function Costs() {
  const [isNewCostOpen, setIsNewCostOpen] = useState(false);
  const [selectedCost, setSelectedCost] = useState<Cost | null>(null);
  const [filters, setFiltersState] = useState<CostFilters>({});

  const setFilters = (f: CostFilters) => { setFiltersState(f); setVisible(50); };
  const { costs, totalCount, isLoading } = useCostsPaginated(filters);
  // a tabela mostra 50 por vez; métricas e gráficos usam todos os custos do filtro
  const [visible, setVisible] = useState(50);
  const shownCosts = costs.slice(0, visible);
  const hasMore = costs.length > visible;

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
        <div className="mb-6 space-y-4">
          <div className="text-sm text-muted-foreground px-2">
            Exibindo {shownCosts.length} de {totalCount} custos
          </div>
          
          <EnhancedCostsTable 
            costs={shownCosts} 
            isLoading={isLoading} 
            onEditClick={setSelectedCost}
          />

          {hasMore && (
            <div className="flex justify-center py-4">
              <Button
                onClick={() => setVisible((v) => v + 50)}
                variant="outline"
                className="min-w-[200px]"
              >
                Carregar mais custos
              </Button>
            </div>
          )}
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
