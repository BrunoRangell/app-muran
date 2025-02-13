
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

export default function Costs() {
  const [isNewCostOpen, setIsNewCostOpen] = useState(false);
  const [selectedCost, setSelectedCost] = useState<Cost | null>(null);
  const [filters, setFilters] = useState<CostFilters>({});

  const { data: costs, isLoading } = useQuery({
    queryKey: ["costs", filters],
    queryFn: async () => {
      let query = supabase
        .from("costs")
        .select(`
          *,
          tags:costs_tags(
            cost_tags(
              id,
              name,
              created_at
            )
          )
        `)
        .order("date", { ascending: false });

      if (filters.startDate) {
        query = query.gte("date", filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte("date", filters.endDate);
      }
      if (filters.subcategory) {
        query = query.eq("subcategory", filters.subcategory);
      }
      if (filters.main_category) {
        query = query.eq("main_category", filters.main_category);
      }
      if (filters.search) {
        query = query.ilike("name", `%${filters.search}%`);
      }
      if (filters.tags && filters.tags.length > 0) {
        // Filtra por custos que têm todas as tags selecionadas
        const { data: tagIds } = await supabase
          .from("cost_tags")
          .select("id")
          .in("name", filters.tags);

        if (tagIds && tagIds.length > 0) {
          const tagIdsArray = tagIds.map(t => t.id);
          const { data: costIds } = await supabase
            .from("costs_tags")
            .select("cost_id")
            .in("tag_id", tagIdsArray);

          if (costIds && costIds.length > 0) {
            query = query.in("id", costIds.map(c => c.cost_id));
          } else {
            return [];
          }
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error("Erro ao buscar custos:", error);
        throw error;
      }

      // Transforma os dados aninhados em um formato mais simples
      return data.map(cost => ({
        ...cost,
        tags: cost.tags
          ? cost.tags
              .map((t: any) => t.cost_tags)
              .filter(Boolean)
          : [],
      }));
    },
  });

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-4 md:p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Registro de Custos</h1>
        <Button onClick={() => setIsNewCostOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Custo
        </Button>
      </div>

      <div className="flex justify-end">
        <DateFilter filters={filters} onFiltersChange={setFilters} />
      </div>

      <CostsMetrics costs={costs || []} filters={filters} />

      <Card className="p-4">
        <CostsFiltersBar filters={filters} onFiltersChange={setFilters} />
        <CostsTable 
          costs={costs || []} 
          isLoading={isLoading} 
          onEditClick={setSelectedCost}
        />
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
    </div>
  );
}
