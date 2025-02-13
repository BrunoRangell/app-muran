
import { CostFilters } from "@/types/cost";
import { SearchFilter } from "./filters/SearchFilter";
import { CategoryFilters } from "./filters/CategoryFilters";
import { TagFilter } from "./filters/TagFilter";
import { ImportCostsDialog } from "./filters/import/ImportCostsDialog";

interface CostsFiltersBarProps {
  filters: CostFilters;
  onFiltersChange: (filters: CostFilters) => void;
}

export function CostsFiltersBar({ filters, onFiltersChange }: CostsFiltersBarProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-4">
      <div className="flex flex-1 items-center gap-4">
        <SearchFilter filters={filters} onFiltersChange={onFiltersChange} />
        <div className="flex-1" />
        <ImportCostsDialog />
      </div>
      <div className="flex gap-4">
        <CategoryFilters filters={filters} onFiltersChange={onFiltersChange} />
        <TagFilter filters={filters} onFiltersChange={onFiltersChange} />
      </div>
    </div>
  );
}
