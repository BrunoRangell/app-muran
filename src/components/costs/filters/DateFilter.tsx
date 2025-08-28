
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  subMonths, 
  startOfYear, 
  endOfYear, 
  setHours, 
  setMinutes, 
  setSeconds, 
  setMilliseconds 
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { CostFilters } from "@/types/cost";

interface DateFilterProps {
  filters: CostFilters;
  onFiltersChange: (filters: CostFilters) => void;
}

type PeriodOption = "custom" | "this-month" | "last-month" | "last-3-months" | "this-year" | "last-year";

export function DateFilter({ filters, onFiltersChange }: DateFilterProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>("custom");
  const [date, setDate] = useState<{ from: Date; to?: Date } | undefined>(() => {
    if (filters.startDate) {
      return {
        from: new Date(filters.startDate),
        to: filters.endDate ? new Date(filters.endDate) : undefined
      };
    }
    return undefined;
  });

  const handlePeriodChange = (period: PeriodOption) => {
    setSelectedPeriod(period);
    
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (period) {
      case "this-month":
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case "last-month":
        start = startOfMonth(subMonths(now, 1));
        end = endOfMonth(subMonths(now, 1));
        break;
      case "last-3-months":
        start = startOfMonth(subMonths(now, 2));
        end = endOfMonth(now);
        break;
      case "this-year":
        start = startOfYear(now);
        end = endOfYear(now);
        break;
      case "last-year":
        const lastYear = new Date(now.getFullYear() - 1, 0, 1);
        start = startOfYear(lastYear);
        end = endOfYear(lastYear);
        break;
      default:
        return;
    }

    start = setHours(setMinutes(setSeconds(setMilliseconds(start, 0), 0), 0), 0);
    end = setHours(setMinutes(setSeconds(setMilliseconds(end, 999), 59), 59), 23);

    setDate({ from: start, to: end });
    onFiltersChange({
      ...filters,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    });
  };

  const handleDateSelect = (range: { from?: Date; to?: Date } | undefined) => {
    setSelectedPeriod("custom");
    setDate(range as { from: Date; to?: Date });
    
    if (range?.from) {
      const start = new Date(range.from);
      
      let end;
      if (range.to) {
        end = new Date(range.to);
      }

      onFiltersChange({
        ...filters,
        startDate: start.toISOString().split('T')[0],
        endDate: end ? end.toISOString().split('T')[0] : undefined,
      });
    } else {
      const { startDate, endDate, ...restFilters } = filters;
      onFiltersChange(restFilters);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full md:w-[240px] justify-start text-left font-normal"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date?.from ? (
            date.to ? (
              <>
                {format(date.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                {format(date.to, "dd/MM/yyyy", { locale: ptBR })}
              </>
            ) : (
              format(date.from, "dd/MM/yyyy", { locale: ptBR })
            )
          ) : (
            <span>Selecione um período</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="space-y-4">
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this-month">Este mês</SelectItem>
              <SelectItem value="last-month">Mês passado</SelectItem>
              <SelectItem value="last-3-months">Últimos 3 meses</SelectItem>
              <SelectItem value="this-year">Este ano</SelectItem>
              <SelectItem value="last-year">Ano passado</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>

          {selectedPeriod === "custom" && (
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from || new Date()}
              selected={date}
              onSelect={handleDateSelect}
              numberOfMonths={2}
              locale={ptBR}
            />
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
