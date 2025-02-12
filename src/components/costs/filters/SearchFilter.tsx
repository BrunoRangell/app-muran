
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { CostFilters } from "@/types/cost";

interface SearchFilterProps {
  filters: CostFilters;
  onFiltersChange: (filters: CostFilters) => void;
}

export function SearchFilter({ filters, onFiltersChange }: SearchFilterProps) {
  return (
    <div className="relative flex-1">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Pesquisar custo..."
        value={filters.search || ""}
        onChange={(e) =>
          onFiltersChange({ ...filters, search: e.target.value })
        }
        className="pl-8"
      />
    </div>
  );
}
