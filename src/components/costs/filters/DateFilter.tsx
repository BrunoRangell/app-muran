
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { CostFilters } from "@/types/cost";

interface DateFilterProps {
  filters: CostFilters;
  onFiltersChange: (filters: CostFilters) => void;
}

export function DateFilter({ filters, onFiltersChange }: DateFilterProps) {
  const [isCustomPeriodOpen, setIsCustomPeriodOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
        start = startOfYear(now);
        end = endOfYear(now);
        break;
      }
      default:
        return;
    }

    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(23, 59, 59, 999);

    onFiltersChange({
      ...filters,
      startDate: format(start, "yyyy-MM-dd"),
      endDate: format(end, "yyyy-MM-dd"),
    });
    setIsDropdownOpen(false);
  };

  const handleDateSelect = (range: { from?: Date; to?: Date }) => {
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
  };

  return (
    <div className="relative">
      <Popover 
        open={isCustomPeriodOpen} 
        onOpenChange={setIsCustomPeriodOpen}
      >
        <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
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
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsCustomPeriodOpen(true);
                setIsDropdownOpen(false);
              }}
              className="font-normal"
            >
              Personalizar período
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <PopoverContent className="w-auto p-0" align="center">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={filters.startDate ? new Date(filters.startDate) : new Date()}
            selected={{
              from: filters.startDate ? new Date(filters.startDate) : undefined,
              to: filters.endDate ? new Date(filters.endDate) : undefined,
            }}
            onSelect={handleDateSelect}
            numberOfMonths={2}
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
