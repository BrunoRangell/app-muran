
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { CostFilters } from "@/types/cost";
import { CostsMetrics } from "@/components/costs/CostsMetrics";
import { CostsTable } from "@/components/costs/CostsTable";
import { CostsFiltersBar } from "@/components/costs/CostsFiltersBar";
import { NewCostDialog } from "@/components/costs/NewCostDialog";
import { EditCostDialog } from "@/components/costs/EditCostDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Cost } from "@/types/cost";
import { DateFilter } from "@/components/costs/filters/DateFilter";
import { Separator } from "@/components/ui/separator";
import { ImportCostsDialog } from "@/components/costs/filters/import/ImportCostsDialog";

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
    <div className="max-w-[1600px] mx-auto space-y-6 p-4 md:p-6">
      {/* Cabeçalho com título e botões de ação */}
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

      {/* Card com métricas principais */}
      <Card className="p-6 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-500">Total de Custos</h4>
            <p className="text-2xl font-bold text-gray-900">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                .format((costs || []).reduce((sum, cost) => sum + cost.amount, 0))}
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500">Média Mensal</h4>
            <p className="text-2xl font-bold text-gray-900">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                .format((costs || []).reduce((sum, cost) => sum + cost.amount, 0) / 
                  Math.max(1, new Set((costs || []).map(c => c.date.substring(0, 7))).size))}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500">Quantidade de Registros</h4>
            <p className="text-2xl font-bold text-gray-900">{(costs || []).length}</p>
          </div>
        </div>
      </Card>

      {/* Gráficos */}
      <CostsMetrics costs={costs || []} filters={filters} />

      {/* Barra de filtros e tabela */}
      <Card className="overflow-hidden">
        <div className="p-4 bg-gray-50 border-b">
          <CostsFiltersBar filters={filters} onFiltersChange={setFilters} />
        </div>
        <div className="p-4">
          <CostsTable 
            costs={costs || []} 
            isLoading={isLoading} 
            onEditClick={setSelectedCost}
          />
        </div>
      </Card>

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
    </div>
  );
}
