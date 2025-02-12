
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  CostFilters, 
  COST_CATEGORIES_HIERARCHY, 
  MACRO_CATEGORIES
} from "@/types/cost";

interface CategoryFiltersProps {
  filters: CostFilters;
  onFiltersChange: (filters: CostFilters) => void;
}

export function CategoryFilters({ filters, onFiltersChange }: CategoryFiltersProps) {
  const [availableCategories, setAvailableCategories] = useState(() => 
    filters.macro_category 
      ? COST_CATEGORIES_HIERARCHY[filters.macro_category].categories
      : []
  );

  return (
    <>
      <Select
        value={filters.macro_category || "all"}
        onValueChange={(value) => {
          if (value === "all") {
            onFiltersChange({ 
              ...filters, 
              macro_category: undefined,
              category: undefined
            });
            setAvailableCategories([]);
          } else {
            const newCategories = COST_CATEGORIES_HIERARCHY[value as keyof typeof COST_CATEGORIES_HIERARCHY].categories;
            setAvailableCategories(newCategories);
            onFiltersChange({ 
              ...filters, 
              macro_category: value as any,
              category: undefined
            });
          }
        }}
      >
        <SelectTrigger className="w-full md:w-[200px]">
          <SelectValue placeholder="Categoria Principal" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          {MACRO_CATEGORIES.map((category) => (
            <SelectItem key={category.value} value={category.value}>
              {category.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

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
          <SelectValue placeholder="Subcategoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          {availableCategories.map((category) => (
            <SelectItem key={category.value} value={category.value}>
              {category.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
