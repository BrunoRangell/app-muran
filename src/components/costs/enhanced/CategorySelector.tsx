import { useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CostCategory } from "@/types/cost";
import { COST_CATEGORIES } from "@/components/costs/constants/categories";

interface CategorySelectorProps {
  value?: CostCategory;
  onValueChange: (value?: CostCategory) => void;
  hasError?: boolean;
  placeholder?: string;
  excludeCategories?: CostCategory[];
  autoOpen?: boolean;
}

export function CategorySelector({ 
  value, 
  onValueChange, 
  hasError = false, 
  placeholder = "Selecionar categoria",
  excludeCategories = [],
  autoOpen = false
}: CategorySelectorProps) {
  const [open, setOpen] = useState(autoOpen);

  const getCategoryName = (categoryId: string): string => {
    const category = COST_CATEGORIES.find(c => c.id === categoryId);
    return category?.name || categoryId;
  };

  const availableCategories = COST_CATEGORIES.filter(
    category => !excludeCategories.includes(category.id as CostCategory)
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-[200px] justify-between text-left font-normal h-8 px-3 text-xs",
            !value && "text-muted-foreground",
            hasError && "border-destructive"
          )}
        >
          {value ? getCategoryName(value) : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0 z-50" align="start">
        <Command shouldFilter={false}>
          <CommandList className="max-h-[400px]">
            <CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="no-category"
                onSelect={() => {
                  onValueChange(undefined);
                  setOpen(false);
                }}
                className="text-xs"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    !value ? "opacity-100" : "opacity-0"
                  )}
                />
                Sem categoria
              </CommandItem>
              {availableCategories.map((category) => (
                <CommandItem
                  key={category.id}
                  value={`${category.name} ${category.description}`}
                  onSelect={() => {
                    onValueChange(category.id as CostCategory);
                    setOpen(false);
                  }}
                  className="text-xs"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === category.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{category.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {category.description}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}