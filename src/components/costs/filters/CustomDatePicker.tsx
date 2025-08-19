import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CostFilters } from "@/types/cost";
import { DateRange } from "react-day-picker";

interface CustomDatePickerProps {
  filters: CostFilters;
  onFiltersChange: (filters: CostFilters) => void;
}

export function CustomDatePicker({ filters, onFiltersChange }: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: filters.startDate ? new Date(filters.startDate) : undefined,
    to: filters.endDate ? new Date(filters.endDate) : undefined,
  });

  const handleDateSelect = (range: DateRange | undefined) => {
    if (!range) {
      setDateRange({ from: undefined, to: undefined });
      return;
    }
    
    setDateRange(range);
    
    if (range.from && range.to) {
      onFiltersChange({
        ...filters,
        startDate: format(range.from, "yyyy-MM-dd"),
        endDate: format(range.to, "yyyy-MM-dd"),
      });
      setIsOpen(false);
    }
  };

  const formatDateRange = () => {
    if (dateRange.from && dateRange.to) {
      return `${format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} - ${format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}`;
    }
    if (dateRange.from) {
      return format(dateRange.from, "dd/MM/yyyy", { locale: ptBR });
    }
    return "Selecionar período";
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-9 px-3 text-sm font-medium border-muran-primary/20 hover:bg-muran-primary/5 hover:border-muran-primary/40",
            (dateRange.from || dateRange.to) && "bg-muran-primary/10 border-muran-primary/30"
          )}
        >
          <CalendarIcon className="h-4 w-4 mr-2" />
          {formatDateRange()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={dateRange}
          onSelect={handleDateSelect}
          numberOfMonths={2}
          className="p-3 pointer-events-auto"
          locale={ptBR}
        />
      </PopoverContent>
    </Popover>
  );
}