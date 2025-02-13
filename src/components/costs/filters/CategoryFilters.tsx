
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
  MAIN_CATEGORIES
} from "@/types/cost";

interface CategoryFiltersProps {
  filters: CostFilters;
  onFiltersChange: (filters: CostFilters) => void;
}

export function CategoryFilters({ filters, onFiltersChange }: CategoryFiltersProps) {
  const [availableCategories, setAvailableCategories] = useState(() => 
    filters.main_category 
      ? COST_CATEGORIES_HIERARCHY[filters.main_category].categories
      : []
  );

  return (
    <>
      <Select
        value={filters.main_category || "all"}
        onValueChange={(value) => {
          if (value === "all") {
            onFiltersChange({ 
              ...filters, 
              main_category: undefined,
              subcategory: undefined
            });
            setAvailableCategories([]);
          } else {
            const newCategories = COST_CATEGORIES_HIERARCHY[value as keyof typeof COST_CATEGORIES_HIERARCHY].categories;
            setAvailableCategories(newCategories);
            onFiltersChange({ 
              ...filters, 
              main_category: value as any,
              subcategory: undefined
            });
          }
        }}
      >
        <SelectTrigger className="w-full md:w-[200px]">
          <SelectValue placeholder="Categoria Principal" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          {MAIN_CATEGORIES.map((category) => (
            <SelectItem key={category.value} value={category.value}>
              {category.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.subcategory || "all"}
        onValueChange={(value) =>
          onFiltersChange({ 
            ...filters, 
            subcategory: value === "all" ? undefined : value as any 
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
