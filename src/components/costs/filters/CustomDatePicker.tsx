import { useState, useEffect } from "react";
import { CalendarIcon, X } from "lucide-react";
import { format, startOfDay, endOfDay, subDays } from "date-fns";
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
  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>({
    from: filters.startDate ? new Date(filters.startDate) : undefined,
    to: filters.endDate ? new Date(filters.endDate) : undefined,
  });

  // Atualizar estado temporário quando os filtros mudarem externamente
  useEffect(() => {
    setTempDateRange({
      from: filters.startDate ? new Date(filters.startDate) : undefined,
      to: filters.endDate ? new Date(filters.endDate) : undefined,
    });
  }, [filters.startDate, filters.endDate]);

  const handleDateSelect = (range: DateRange | undefined) => {
    setTempDateRange(range);
  };

  const handleApply = () => {
    if (tempDateRange?.from && tempDateRange?.to) {
      onFiltersChange({
        ...filters,
        startDate: format(startOfDay(tempDateRange.from), "yyyy-MM-dd"),
        endDate: format(endOfDay(tempDateRange.to), "yyyy-MM-dd"),
      });
    } else if (!tempDateRange?.from && !tempDateRange?.to) {
      onFiltersChange({
        ...filters,
        startDate: undefined,
        endDate: undefined,
      });
    }
    setIsOpen(false);
  };

  const handleClear = () => {
    setTempDateRange({ from: undefined, to: undefined });
    onFiltersChange({
      ...filters,
      startDate: undefined,
      endDate: undefined,
    });
    setIsOpen(false);
  };

  const handleQuickSelect = (days: number) => {
    const today = new Date();
    const from = startOfDay(subDays(today, days - 1));
    const to = endOfDay(today);
    
    setTempDateRange({ from, to });
  };

  const formatDateRange = () => {
    const currentFrom = filters.startDate ? new Date(filters.startDate) : undefined;
    const currentTo = filters.endDate ? new Date(filters.endDate) : undefined;
    
    if (currentFrom && currentTo) {
      return `${format(currentFrom, "dd/MM/yyyy", { locale: ptBR })} - ${format(currentTo, "dd/MM/yyyy", { locale: ptBR })}`;
    }
    if (currentFrom) {
      return format(currentFrom, "dd/MM/yyyy", { locale: ptBR });
    }
    return "Período personalizado";
  };

  const hasSelection = tempDateRange?.from || tempDateRange?.to;
  const isValid = tempDateRange?.from && tempDateRange?.to;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-9 px-3 text-sm font-medium border-muran-primary/20 hover:bg-muran-primary/5 hover:border-muran-primary/40 transition-colors",
            (filters.startDate || filters.endDate) && "bg-muran-primary/10 border-muran-primary/30"
          )}
        >
          <CalendarIcon className="h-4 w-4 mr-2" />
          {formatDateRange()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="start">
        <div className="p-4 border-b border-border/50">
          <h4 className="text-sm font-medium text-foreground mb-3">Período Personalizado</h4>
          
          {/* Atalhos rápidos */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickSelect(7)}
              className="text-xs h-7 px-2 hover:bg-muran-primary/10 hover:border-muran-primary/30"
            >
              Últimos 7 dias
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickSelect(30)}
              className="text-xs h-7 px-2 hover:bg-muran-primary/10 hover:border-muran-primary/30"
            >
              Últimos 30 dias
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickSelect(90)}
              className="text-xs h-7 px-2 hover:bg-muran-primary/10 hover:border-muran-primary/30"
            >
              Últimos 90 dias
            </Button>
          </div>

          {/* Preview da seleção */}
          {hasSelection && (
            <div className="text-xs text-muted-foreground mb-2">
              {tempDateRange?.from && tempDateRange?.to ? (
                <>
                  <span className="font-medium">Selecionado:</span>{" "}
                  {format(tempDateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                  {format(tempDateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                </>
              ) : tempDateRange?.from ? (
                <>
                  <span className="font-medium">Data inicial:</span>{" "}
                  {format(tempDateRange.from, "dd/MM/yyyy", { locale: ptBR })}
                </>
              ) : (
                "Selecione o período desejado"
              )}
            </div>
          )}
        </div>

        <div className="p-3">
          <Calendar
            mode="range"
            selected={tempDateRange}
            onSelect={handleDateSelect}
            numberOfMonths={1}
            className="pointer-events-auto"
            locale={ptBR}
          />
        </div>

        <div className="flex items-center justify-between p-4 border-t border-border/50 bg-muted/30">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClear}
            className="text-xs h-8 px-3 hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-3 w-3 mr-1" />
            Limpar
          </Button>
          
          <Button
            size="sm"
            onClick={handleApply}
            disabled={!isValid}
            className="text-xs h-8 px-4 bg-muran-primary hover:bg-muran-primary/90 text-white"
          >
            Aplicar Período
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}