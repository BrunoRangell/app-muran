
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { CostFilters } from "@/types/cost";
import { CostsMetrics } from "@/components/costs/CostsMetrics";
import { CostsTable } from "@/components/costs/CostsTable";
import { CostsFiltersBar } from "@/components/costs/CostsFiltersBar";
import { NewCostDialog } from "@/components/costs/NewCostDialog";
import { EditCostDialog } from "@/components/costs/EditCostDialog";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle } from "lucide-react";
import { Cost } from "@/types/cost";
import { DateFilter } from "@/components/costs/filters/DateFilter";
import { Separator } from "@/components/ui/separator";
import { ImportCostsDialog } from "@/components/costs/filters/import/ImportCostsDialog";
import { Toaster } from "@/components/ui/toaster";
import { TeamMemberCheck } from "@/components/auth/TeamMemberCheck";
import { useFinancialData } from "@/hooks/useFinancialData";

export default function Costs() {
  const [isNewCostOpen, setIsNewCostOpen] = useState(false);
  const [selectedCost, setSelectedCost] = useState<Cost | null>(null);
  const [filters, setFilters] = useState<CostFilters>({});

  const { data: financialData, isLoading, error } = useFinancialData();

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-muran-primary"></div>
          <span className="ml-3">Carregando custos...</span>
        </div>
      </div>
    );
  }

  if (error || !financialData) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6">
        <div className="flex flex-col items-center justify-center p-8 text-red-500 gap-4">
          <AlertCircle className="h-12 w-12" />
          <h2 className="text-xl font-semibold">Erro ao carregar custos</h2>
          <p className="text-center text-gray-600">
            Não foi possível carregar os dados de custos.
            <br />
            Por favor, tente novamente mais tarde.
          </p>
        </div>
      </div>
    );
  }

  const costs = financialData.costs || [];

  // Filtrar custos localmente
  const filteredCosts = costs.filter(cost => {
    if (filters.startDate && cost.date < filters.startDate) return false;
    if (filters.endDate && cost.date > filters.endDate) return false;
    if (filters.categories?.length && !filters.categories.includes(cost.category_id)) return false;
    if (filters.search && !cost.name?.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  // Calcular totais
  const totalCosts = filteredCosts.reduce((sum, cost) => sum + cost.amount, 0);
  const monthlyAverage = totalCosts / Math.max(1, new Set(filteredCosts.map(c => c.date.substring(0, 7))).size);

  return (
    <TeamMemberCheck>
      <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Registro de Custos</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie e acompanhe todos os custos do seu negócio
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <DateFilter filters={filters} onFiltersChange={setFilters} />
            <div className="flex items-center gap-2">
              <Button onClick={() => setIsNewCostOpen(true)} className="bg-muran-primary hover:bg-muran-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar custo manualmente
              </Button>
              <ImportCostsDialog />
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        <Card className="p-6 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Total de Custos</h4>
              <p className="text-2xl font-bold text-gray-900">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                  .format(totalCosts)}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Média Mensal</h4>
              <p className="text-2xl font-bold text-gray-900">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                  .format(monthlyAverage)}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500">Quantidade de Registros</h4>
              <p className="text-2xl font-bold text-gray-900">{filteredCosts.length}</p>
            </div>
          </div>
        </Card>

        <CostsMetrics costs={filteredCosts} filters={filters} />

        <Card className="overflow-hidden">
          <div className="p-4 bg-gray-50 border-b">
            <CostsFiltersBar filters={filters} onFiltersChange={setFilters} />
          </div>
          <div className="p-4">
            <CostsTable 
              costs={filteredCosts} 
              isLoading={false} 
              onEditClick={setSelectedCost}
            />
          </div>
        </Card>

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
    </TeamMemberCheck>
  );
}
