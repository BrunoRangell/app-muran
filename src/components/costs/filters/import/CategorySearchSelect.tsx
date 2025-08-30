import { useState } from "react";
import { CostCategory } from "@/types/cost";
import { COST_CATEGORIES } from "../../constants/categories";
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
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategorySearchSelectProps {
  value?: CostCategory;
  onValueChange: (value?: CostCategory) => void;
  hasError?: boolean;
}

export function CategorySearchSelect({ value, onValueChange, hasError }: CategorySearchSelectProps) {
  const [open, setOpen] = useState(false);

  const getCategoryName = (categoryId?: CostCategory) => {
    if (!categoryId) return "";
    const category = COST_CATEGORIES.find(c => c.id === categoryId);
    return category?.name || "";
  };

  const selectedCategory = value ? COST_CATEGORIES.find(c => c.id === value) : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-[300px] justify-between",
            hasError && "border-red-500",
            !selectedCategory && "text-muted-foreground"
          )}
        >
          {selectedCategory ? selectedCategory.name : "Sem categoria"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" side="left" align="start">
        <Command>
          <CommandInput placeholder="Buscar categoria..." />
          <CommandList>
            <CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value=""
                onSelect={() => {
                  onValueChange(undefined);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    !value ? "opacity-100" : "opacity-0"
                  )}
                />
                Sem categoria
              </CommandItem>
              {COST_CATEGORIES.map((category) => (
                <CommandItem
                  key={category.id}
                  value={`${category.name} ${category.description}`}
                  onSelect={() => {
                    onValueChange(category.id as CostCategory);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === category.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">
                      {category.name}
                    </span>
                    <span className="text-sm text-muted-foreground">
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