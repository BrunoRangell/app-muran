
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { CostFilters } from "@/types/cost";

interface DateFilterProps {
  filters: CostFilters;
  onFiltersChange: (filters: CostFilters) => void;
}

export function DateFilter({ filters, onFiltersChange }: DateFilterProps) {
  const [date, setDate] = useState<{ from: Date; to?: Date } | undefined>(() => {
    if (filters.startDate) {
      return {
        from: new Date(filters.startDate),
        to: filters.endDate ? new Date(filters.endDate) : undefined
      };
    }
    return undefined;
  });

  const handleDateSelect = (range: { from?: Date; to?: Date } | undefined) => {
    setDate(range as { from: Date; to?: Date });
    
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
    } else {
      const { startDate, endDate, ...restFilters } = filters;
      onFiltersChange(restFilters);
    }
  };

  return (
    <div className="relative">
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
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from || new Date()}
            selected={date}
            onSelect={handleDateSelect}
            numberOfMonths={2}
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
