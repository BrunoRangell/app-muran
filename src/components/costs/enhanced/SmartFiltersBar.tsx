import { CostFilters } from "@/types/cost";
import { SearchFilter } from "@/components/costs/filters/SearchFilter";
import { CategoryFilters } from "@/components/costs/filters/CategoryFilters";
import { PeriodQuickFilters } from "@/components/costs/filters/PeriodQuickFilters";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface SmartFiltersBarProps {
  filters: CostFilters;
  onFiltersChange: (filters: CostFilters) => void;
}

export function SmartFiltersBar({ filters, onFiltersChange }: SmartFiltersBarProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Filtros Rápidos de Período */}
          <PeriodQuickFilters filters={filters} onFiltersChange={onFiltersChange} />
          
          <Separator />
          
          {/* Busca e Categorias */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <SearchFilter filters={filters} onFiltersChange={onFiltersChange} />
            </div>
            <div className="flex items-center gap-4">
              <CategoryFilters filters={filters} onFiltersChange={onFiltersChange} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}