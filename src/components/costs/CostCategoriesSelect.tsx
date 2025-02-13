
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CategoryInfo, CostCategory } from "@/types/cost";
import { useCostCategories } from "./schemas/costFormSchema";

interface CostCategoriesSelectProps {
  value: CostCategory[];
  onChange: (value: CostCategory[]) => void;
  error?: string;
}

export function CostCategoriesSelect({ value, onChange, error }: CostCategoriesSelectProps) {
  const [open, setOpen] = useState(false);
  const categories = useCostCategories();

  const toggleCategory = (categoryId: CostCategory) => {
    if (value.includes(categoryId)) {
      onChange(value.filter((id) => id !== categoryId));
    } else {
      onChange([...value, categoryId]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value.length === 0 ? (
            <span className="text-muted-foreground">Selecione as categorias...</span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {value.map((categoryId) => {
                const category = categories.find((c) => c.id === categoryId);
                return category ? (
                  <Badge key={category.id} variant="secondary">
                    {category.name}
                  </Badge>
                ) : null;
              })}
            </div>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput placeholder="Procurar categoria..." />
          <CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>
          <CommandGroup>
            <ScrollArea className="h-[300px]">
              {categories.map((category) => (
                <CommandItem
                  key={category.id}
                  value={category.id}
                  onSelect={() => toggleCategory(category.id)}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center">
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value.includes(category.id) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <p className="ml-6 text-sm text-muted-foreground">
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
