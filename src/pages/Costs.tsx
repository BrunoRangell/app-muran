
import { useState } from "react";
import { CostFilters, Cost } from "@/types/cost";
import { NewCostDialog } from "@/components/costs/NewCostDialog";
import { EditCostDialog } from "@/components/costs/EditCostDialog";
import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CostsPageHeader } from "@/components/costs/enhanced/CostsPageHeader";
import { SmartFiltersBar } from "@/components/costs/enhanced/SmartFiltersBar";
import { MonthTabs } from "@/components/costs/enhanced/MonthTabs";
import { CostsAnalyticsTab } from "@/components/costs/analytics/CostsAnalyticsTab";
import { CostsListingTab } from "@/components/costs/listing/CostsListingTab";
import { useCosts } from "@/hooks/queries/useCosts";

export default function Costs() {
  const [isNewCostOpen, setIsNewCostOpen] = useState(false);
  const [selectedCost, setSelectedCost] = useState<Cost | null>(null);
  const [filters, setFilters] = useState<CostFilters>({});
  const [selectedMonth, setSelectedMonth] = useState<string | undefined>();

  const { costs, isLoading, deleteCost, deleteCosts, updateCostCategory } = useCosts({
    ...filters,
    monthFilter: selectedMonth
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header padronizado */}
        <div className="mb-6">
          <CostsPageHeader onNewCostClick={() => setIsNewCostOpen(true)} />
        </div>

        {/* Abas de meses - compartilhadas */}
        <div className="mb-6">
          <MonthTabs 
            costs={costs} 
            onMonthChange={setSelectedMonth} 
            selectedMonth={selectedMonth} 
          />
        </div>

        {/* Filtros inteligentes - compartilhados */}
        <div className="mb-6">
          <SmartFiltersBar filters={filters} onFiltersChange={setFilters} />
        </div>

        {/* Sistema de Abas Principal */}
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="analytics">Análise</TabsTrigger>
            <TabsTrigger value="listing">Listagem</TabsTrigger>
          </TabsList>
          
          <TabsContent value="analytics">
            <CostsAnalyticsTab costs={costs} filters={filters} />
          </TabsContent>
          
          <TabsContent value="listing">
            <CostsListingTab 
              costs={costs} 
              isLoading={isLoading} 
              onEditClick={setSelectedCost}
              deleteCost={deleteCost}
              deleteCosts={deleteCosts}
              updateCostCategory={updateCostCategory}
            />
          </TabsContent>
        </Tabs>

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
