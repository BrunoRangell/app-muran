
import { useState } from "react";
import { CostFilters, Cost } from "@/types/cost";
import { NewCostDialog } from "@/components/costs/NewCostDialog";
import { EditCostDialog } from "@/components/costs/EditCostDialog";
import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CostsPageHeader } from "@/components/costs/enhanced/CostsPageHeader";
import { SmartFiltersBar } from "@/components/costs/enhanced/SmartFiltersBar";

import { CostsAnalyticsTab } from "@/components/costs/analytics/CostsAnalyticsTab";
import { CostsListingTab } from "@/components/costs/listing/CostsListingTab";
import { useCosts } from "@/hooks/queries/useCosts";

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export default function Costs() {
  const [isNewCostOpen, setIsNewCostOpen] = useState(false);
  const [selectedCost, setSelectedCost] = useState<Cost | null>(null);
  const [filters, setFilters] = useState<CostFilters>({});
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: '', direction: 'asc' });
  const { costs, isLoading, deleteCost, deleteCosts, updateCostCategory, updateMultipleCostCategories } = useCosts(filters);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header aprimorado */}
        <div className="mb-8">
          <CostsPageHeader onNewCostClick={() => setIsNewCostOpen(true)} />
        </div>

        {/* Sistema de Abas Principal */}
        <div className="bg-card rounded-lg border shadow-sm">
          <Tabs defaultValue="analytics" className="w-full" onValueChange={() => setFilters({})}>
            <div className="border-b bg-muted/50 rounded-t-lg">
              <TabsList className="w-full justify-start h-auto p-1 bg-transparent">
                <TabsTrigger value="analytics">
                  Análise
                </TabsTrigger>
                <TabsTrigger value="listing">
                  Listagem
                </TabsTrigger>
              </TabsList>
            </div>
            
            {/* Filtros inteligentes - abaixo das abas */}
            <div className="p-6 border-b bg-muted/20">
              <SmartFiltersBar filters={filters} onFiltersChange={setFilters} />
            </div>
            
            <div className="p-6">
              <TabsContent value="analytics" className="mt-0">
                <CostsAnalyticsTab costs={costs} filters={filters} />
              </TabsContent>
              
              <TabsContent value="listing" className="mt-0">
                <CostsListingTab 
                  costs={costs} 
                  isLoading={isLoading} 
                  onEditClick={setSelectedCost}
                  deleteCost={deleteCost}
                  deleteCosts={deleteCosts}
                  updateCostCategory={updateCostCategory}
                  updateMultipleCostCategories={updateMultipleCostCategories}
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />
              </TabsContent>
            </div>
          </Tabs>
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
