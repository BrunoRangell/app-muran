
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
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

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

  const handlePresetPeriod = (preset: string) => {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (preset) {
      case 'this-month':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'last-month':
        start = startOfMonth(subMonths(now, 1));
        end = endOfMonth(subMonths(now, 1));
        break;
      case 'last-3-months':
        start = startOfMonth(subMonths(now, 2));
        end = endOfMonth(now);
        break;
      case 'last-6-months':
        start = startOfMonth(subMonths(now, 5));
        end = endOfMonth(now);
        break;
      case 'last-12-months':
        start = startOfMonth(subMonths(now, 11));
        end = endOfMonth(now);
        break;
      case 'last-24-months':
        start = startOfMonth(subMonths(now, 23));
        end = endOfMonth(now);
        break;
      case 'this-year':
        start = startOfYear(now);
        end = endOfYear(now);
        break;
      default:
        return;
    }

    onFiltersChange({
      ...filters,
      startDate: format(start, "yyyy-MM-dd"),
      endDate: format(end, "yyyy-MM-dd"),
    });
  };

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

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full md:w-[240px] justify-between text-left font-normal">
            <div className="flex items-center">
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
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[240px]">
          <DropdownMenuItem onSelect={() => handlePresetPeriod('this-month')}>
            Este mês
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handlePresetPeriod('last-month')}>
            Mês passado
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handlePresetPeriod('last-3-months')}>
            Últimos 3 meses
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handlePresetPeriod('last-6-months')}>
            Últimos 6 meses
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handlePresetPeriod('last-12-months')}>
            Últimos 12 meses
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handlePresetPeriod('last-24-months')}>
            Últimos 24 meses
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handlePresetPeriod('this-year')}>
            Este ano
          </DropdownMenuItem>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="w-full justify-start font-normal">
                Personalizar período
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
        </DropdownMenuContent>
      </DropdownMenu>

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
