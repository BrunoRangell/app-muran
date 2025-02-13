
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CostFilters } from "@/types/cost";
import { useCostCategories } from "../schemas/costFormSchema";

interface CategoryFiltersProps {
  filters: CostFilters;
  onFiltersChange: (filters: CostFilters) => void;
}

export function CategoryFilters({ filters, onFiltersChange }: CategoryFiltersProps) {
  const categories = useCostCategories();

  return (
    <Select
      value={filters.category || "all"}
      onValueChange={(value) =>
        onFiltersChange({ 
          ...filters, 
          category: value === "all" ? undefined : value as any 
        })
      }
    >
      <SelectTrigger className="w-full md:w-[200px]">
        <SelectValue placeholder="Categoria" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todas</SelectItem>
        {categories.map((category) => (
          <SelectItem key={category.id} value={category.id}>
            {category.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
