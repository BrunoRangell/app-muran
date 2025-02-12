import { Input } from "@/components/ui/input";
import { Search, Calendar as CalendarIcon, ChevronDown } from "lucide-react";
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
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const [isCustomPeriodOpen, setIsCustomPeriodOpen] = useState(false);

  const handlePresetPeriod = (preset: string) => {
    const now = new Date();
    let start: Date = new Date();
    let end: Date = new Date();

    switch (preset) {
      case 'this-month': {
        const thisMonth = startOfMonth(now);
        start = thisMonth;
        end = endOfMonth(thisMonth);
        break;
      }
      case 'last-month': {
        const lastMonth = subMonths(startOfMonth(now), 1);
        start = lastMonth;
        end = endOfMonth(lastMonth);
        break;
      }
      case 'last-3-months': {
        start = startOfMonth(subMonths(now, 2));
        end = endOfMonth(now);
        break;
      }
      case 'last-6-months': {
        start = startOfMonth(subMonths(now, 5));
        end = endOfMonth(now);
        break;
      }
      case 'last-12-months': {
        start = startOfMonth(subMonths(now, 11));
        end = endOfMonth(now);
        break;
      }
      case 'last-24-months': {
        start = startOfMonth(subMonths(now, 23));
        end = endOfMonth(now);
        break;
      }
      case 'this-year': {
        const thisYear = now.getFullYear();
        start = startOfYear(now);
        end = endOfYear(now);
        break;
      }
      default:
        return;
    }

    console.log('Período selecionado:', {
      preset,
      start: format(start, "dd/MM/yyyy"),
      end: format(end, "dd/MM/yyyy")
    });

    // Garantir que as datas comecem e terminem no UTC correto
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(23, 59, 59, 999);

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

      <div className="relative">
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
            <DropdownMenuItem 
              onSelect={() => setIsCustomPeriodOpen(true)}
              className="font-normal"
            >
              Personalizar período
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Popover open={isCustomPeriodOpen} onOpenChange={setIsCustomPeriodOpen}>
          <PopoverTrigger className="sr-only" />
          <PopoverContent className="w-auto p-0" align="center">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={filters.startDate ? new Date(filters.startDate) : new Date()}
              selected={{
                from: filters.startDate ? new Date(filters.startDate) : undefined,
                to: filters.endDate ? new Date(filters.endDate) : undefined,
              }}
              onSelect={(range) => {
                if (range?.from) {
                  const start = new Date(range.from);
                  start.setUTCHours(0, 0, 0, 0);
                  
                  let end;
                  if (range.to) {
                    end = new Date(range.to);
                    end.setUTCHours(23, 59, 59, 999);
                  }

                  onFiltersChange({
                    ...filters,
                    startDate: format(start, "yyyy-MM-dd"),
                    endDate: end ? format(end, "yyyy-MM-dd") : undefined,
                  });

                  if (range.to) {
                    setIsCustomPeriodOpen(false);
                  }
                }
              }}
              numberOfMonths={2}
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
      </div>

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
