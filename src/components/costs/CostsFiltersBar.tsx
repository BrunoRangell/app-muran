
import { CostFilters } from "@/types/cost";
import { Button } from "@/components/ui/button";
import { SearchFilter } from "./filters/SearchFilter";
import { CategoryFilters } from "./filters/CategoryFilters";
import { DateFilter } from "./filters/DateFilter";

interface CostsFiltersBarProps {
  filters: CostFilters;
  onFiltersChange: (filters: CostFilters) => void;
}

export function CostsFiltersBar({ filters, onFiltersChange }: CostsFiltersBarProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-4">
      <SearchFilter filters={filters} onFiltersChange={onFiltersChange} />
      <CategoryFilters filters={filters} onFiltersChange={onFiltersChange} />
      <DateFilter filters={filters} onFiltersChange={onFiltersChange} />
      <Button
        variant="outline"
        onClick={() => onFiltersChange({})}
        className="w-full md:w-auto"
      >
        Limpar Filtros
      </Button>
    </div>
  );
}
