
import React from "react";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CostFilters, CostCategory } from "@/types/cost";
import { useCostCategories } from "../schemas/costFormSchema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CategoryFiltersProps {
  filters: CostFilters;
  onFiltersChange: (filters: CostFilters) => void;
}

export function CategoryFilters({ filters, onFiltersChange }: CategoryFiltersProps) {
  const categories = useCostCategories();
  const selectedCategories = filters.categories || [];

  const toggleCategory = (categoryId: CostCategory) => {
    const newCategories = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(id => id !== categoryId)
      : [...selectedCategories, categoryId];

    onFiltersChange({
      ...filters,
      categories: newCategories.length > 0 ? newCategories : undefined
    });
  };

  if (!categories?.length) {
    return (
      <Button variant="outline" className="w-full md:w-[280px] justify-between" disabled>
        <span className="text-muted-foreground">Carregando categorias...</span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full md:w-[280px] justify-between">
          {selectedCategories.length === 0 ? (
            <span className="text-muted-foreground">Selecione as categorias...</span>
          ) : (
            <div className="flex flex-wrap gap-1 max-w-[200px]">
              {selectedCategories.map((categoryId) => {
                const category = categories.find((c) => c.id === categoryId);
                return category ? (
                  <Badge
                    key={category.id}
                    variant="secondary"
                    className="truncate max-w-[100px]"
                  >
                    {category.name}
                  </Badge>
                ) : null;
              })}
            </div>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[380px] max-h-[300px] overflow-y-auto">
        {categories.map((category) => (
          <DropdownMenuItem
            key={category.id}
            onSelect={(event) => {
              event.preventDefault();
              toggleCategory(category.id as CostCategory);
            }}
            className="flex flex-col items-start py-2"
          >
            <div className="flex items-center w-full">
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  selectedCategories.includes(category.id as CostCategory)
                    ? "opacity-100"
                    : "opacity-0"
                )}
              />
              <span className="font-medium">{category.name}</span>
            </div>
            <p className="text-sm text-muted-foreground ml-6">
              {category.description}
            </p>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
