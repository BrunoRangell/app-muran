
import { CostFilters } from "@/types/cost";
import { SearchFilter } from "./filters/SearchFilter";
import { CategoryFilters } from "./filters/CategoryFilters";

interface CostsFiltersBarProps {
  filters: CostFilters;
  onFiltersChange: (filters: CostFilters) => void;
}

export function CostsFiltersBar({ filters, onFiltersChange }: CostsFiltersBarProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="flex-1">
        <SearchFilter filters={filters} onFiltersChange={onFiltersChange} />
      </div>
      <div className="flex flex-col md:flex-row gap-4 md:items-center">
        <CategoryFilters filters={filters} onFiltersChange={onFiltersChange} />
      </div>
    </div>
  );
}
