
import { CostFilters } from "@/types/cost";
import { SearchFilter } from "./filters/SearchFilter";
import { CategoryFilters } from "./filters/CategoryFilters";
import { TagFilter } from "./filters/TagFilter";

interface CostsFiltersBarProps {
  filters: CostFilters;
  onFiltersChange: (filters: CostFilters) => void;
}

export function CostsFiltersBar({ filters, onFiltersChange }: CostsFiltersBarProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-4">
      <SearchFilter filters={filters} onFiltersChange={onFiltersChange} />
      <CategoryFilters filters={filters} onFiltersChange={onFiltersChange} />
      <TagFilter filters={filters} onFiltersChange={onFiltersChange} />
    </div>
  );
}
