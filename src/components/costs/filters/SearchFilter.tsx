
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { CostFilters } from "@/types/cost";

interface SearchFilterProps {
  filters: CostFilters;
  onFiltersChange: (filters: CostFilters) => void;
}

export function SearchFilter({ filters, onFiltersChange }: SearchFilterProps) {
  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Buscar por nome do custo..."
        value={filters.search || ""}
        onChange={(e) =>
          onFiltersChange({ ...filters, search: e.target.value })
        }
        className="pl-10 w-full"
      />
    </div>
  );
}
