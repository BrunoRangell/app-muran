
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CostFilters } from "@/types/cost";
import { useCostCategories } from "../schemas/costFormSchema";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface CategoryFiltersProps {
  filters: CostFilters;
  onFiltersChange: (filters: CostFilters) => void;
}

export function CategoryFilters({ filters, onFiltersChange }: CategoryFiltersProps) {
  const categories = useCostCategories();

  const selectedCategory = categories.find(
    (category) => category.id === filters.category
  );

  return (
    <div className="relative">
      <HoverCard>
        <HoverCardTrigger>
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
                <SelectItem 
                  key={category.id} 
                  value={category.id}
                  className="flex flex-col items-start"
                >
                  <span className="font-medium">{category.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {category.description}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </HoverCardTrigger>
        {selectedCategory && (
          <HoverCardContent side="right" align="start" className="w-80">
            <div>
              <h4 className="font-semibold">{selectedCategory.name}</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedCategory.description}
              </p>
            </div>
          </HoverCardContent>
        )}
      </HoverCard>
    </div>
  );
}
