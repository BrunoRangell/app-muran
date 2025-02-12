
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
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
  MACRO_CATEGORIES, 
  getCategoriesForMacroCategory 
} from "@/types/cost";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";

interface CostsFiltersBarProps {
  filters: CostFilters;
  onFiltersChange: (filters: CostFilters) => void;
}

export function CostsFiltersBar({ filters, onFiltersChange }: CostsFiltersBarProps) {
  const [availableCategories, setAvailableCategories] = useState(() => 
    filters.macro_category 
      ? COST_CATEGORIES_HIERARCHY[filters.macro_category].categories
      : []
  );

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-4">
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

      <Select
        value={filters.macro_category}
        onValueChange={(value: any) => {
          const newCategories = COST_CATEGORIES_HIERARCHY[value].categories;
          setAvailableCategories(newCategories);
          onFiltersChange({ 
            ...filters, 
            macro_category: value,
            category: undefined // Limpa a categoria quando muda a macro
          });
        }}
      >
        <SelectTrigger className="w-full md:w-[200px]">
          <SelectValue placeholder="Categoria Principal" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Todas</SelectItem>
          {MACRO_CATEGORIES.map((category) => (
            <SelectItem key={category.value} value={category.value}>
              {category.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.category}
        onValueChange={(value: any) =>
          onFiltersChange({ ...filters, category: value })
        }
      >
        <SelectTrigger className="w-full md:w-[200px]">
          <SelectValue placeholder="Subcategoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Todas</SelectItem>
          {availableCategories.map((category) => (
            <SelectItem key={category.value} value={category.value}>
              {category.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full md:w-[240px] justify-start text-left font-normal">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {filters.startDate ? (
              filters.endDate ? (
                <>
                  {format(new Date(filters.startDate), "dd/MM/yyyy", { locale: ptBR })} -{" "}
                  {format(new Date(filters.endDate), "dd/MM/yyyy", { locale: ptBR })}
                </>
              ) : (
                format(new Date(filters.startDate), "dd/MM/yyyy", { locale: ptBR })
              )
            ) : (
              <span>Selecione um período</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={filters.startDate ? new Date(filters.startDate) : new Date()}
            selected={{
              from: filters.startDate ? new Date(filters.startDate) : undefined,
              to: filters.endDate ? new Date(filters.endDate) : undefined,
            }}
            onSelect={(range) =>
              onFiltersChange({
                ...filters,
                startDate: range?.from ? format(range.from, "yyyy-MM-dd") : undefined,
                endDate: range?.to ? format(range.to, "yyyy-MM-dd") : undefined,
              })
            }
            numberOfMonths={2}
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>

      <Button
        variant="outline"
        onClick={() => onFiltersChange({})}
        className="w-full md:w-auto"
      >
        Limpar Filtros
      </Button>
    </div>
  );
}
