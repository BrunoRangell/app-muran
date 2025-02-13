
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CostFilters, CostCategory } from "@/types/cost";
import { useCostCategories } from "../schemas/costFormSchema";
import { ScrollArea } from "@/components/ui/scroll-area";

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

  // Garantir que temos um array de categorias válido para o Command
  if (!Array.isArray(categories)) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full md:w-[280px] justify-between"
        >
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
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Procurar categoria..." />
          <CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>
          <CommandGroup>
            <ScrollArea className="h-[300px]">
              {categories.map((category) => (
                <CommandItem
                  key={category.id}
                  value={category.id}
                  onSelect={() => toggleCategory(category.id as CostCategory)}
                >
                  <div className="flex flex-col flex-1 py-2">
                    <div className="flex items-center">
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
                  </div>
                </CommandItem>
              ))}
            </ScrollArea>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
