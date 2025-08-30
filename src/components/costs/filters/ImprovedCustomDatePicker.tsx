import { useState, useEffect } from "react";
import { CalendarIcon, X } from "lucide-react";
import { format, startOfDay, endOfDay, subDays, startOfToday, startOfYesterday, endOfYesterday, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
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

interface ImprovedCustomDatePickerProps {
  filters: CostFilters;
  onFiltersChange: (filters: CostFilters) => void;
}

export function ImprovedCustomDatePicker({ filters, onFiltersChange }: ImprovedCustomDatePickerProps) {
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

  const handleQuickSelect = (type: string) => {
    let from: Date;
    let to: Date;

    switch (type) {
      case 'today':
        from = startOfToday();
        to = endOfDay(new Date());
        break;
      case 'yesterday':
        from = startOfYesterday();
        to = endOfYesterday();
        break;
      case 'thisWeek':
        from = startOfWeek(new Date(), { weekStartsOn: 1 }); // Segunda-feira
        to = endOfWeek(new Date(), { weekStartsOn: 1 });
        break;
      case 'thisMonth':
        from = startOfMonth(new Date());
        to = endOfMonth(new Date());
        break;
      case 'last7days':
        from = startOfDay(subDays(new Date(), 6));
        to = endOfDay(new Date());
        break;
      case 'last30days':
        from = startOfDay(subDays(new Date(), 29));
        to = endOfDay(new Date());
        break;
      default:
        return;
    }
    
    setTempDateRange({ from, to });
  };

  const formatDateRange = () => {
    const currentFrom = filters.startDate ? new Date(filters.startDate) : undefined;
    const currentTo = filters.endDate ? new Date(filters.endDate) : undefined;
    
    if (currentFrom && currentTo) {
      if (format(currentFrom, "yyyy-MM-dd") === format(currentTo, "yyyy-MM-dd")) {
        return format(currentFrom, "dd/MM/yyyy", { locale: ptBR });
      }
      return `${format(currentFrom, "dd/MM", { locale: ptBR })} - ${format(currentTo, "dd/MM/yyyy", { locale: ptBR })}`;
    }
    if (currentFrom) {
      return `A partir de ${format(currentFrom, "dd/MM/yyyy", { locale: ptBR })}`;
    }
    return "Selecionar período";
  };

  const hasSelection = tempDateRange?.from || tempDateRange?.to;
  const isValid = tempDateRange?.from && tempDateRange?.to;

  const quickFilters = [
    { key: 'today', label: 'Hoje' },
    { key: 'yesterday', label: 'Ontem' },
    { key: 'thisWeek', label: 'Esta semana' },
    { key: 'thisMonth', label: 'Este mês' },
    { key: 'last7days', label: 'Últimos 7 dias' },
    { key: 'last30days', label: 'Últimos 30 dias' },
  ];

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
      <PopoverContent className="w-80 p-0" align="start">
        {/* Header com shortcuts */}
        <div className="p-3 border-b border-border/50">
          <h4 className="text-sm font-medium text-foreground mb-3">Período</h4>
          
          <div className="grid grid-cols-2 gap-2">
            {quickFilters.map((filter) => (
              <Button
                key={filter.key}
                size="sm"
                variant="ghost"
                onClick={() => handleQuickSelect(filter.key)}
                className="h-8 text-xs justify-start hover:bg-muran-primary/10 hover:text-muran-primary"
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Calendário */}
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

        {/* Preview da seleção */}
        {hasSelection && (
          <div className="px-3 py-2 border-t border-border/50 bg-muted/30">
            <div className="text-xs text-muted-foreground">
              {tempDateRange?.from && tempDateRange?.to ? (
                <>
                  <span className="font-medium">Período:</span>{" "}
                  {format(tempDateRange.from, "dd/MM", { locale: ptBR })} -{" "}
                  {format(tempDateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                </>
              ) : tempDateRange?.from ? (
                <>
                  <span className="font-medium">Início:</span>{" "}
                  {format(tempDateRange.from, "dd/MM/yyyy", { locale: ptBR })}
                </>
              ) : (
                "Selecione o período desejado"
              )}
            </div>
          </div>
        )}

        {/* Botões de ação */}
        <div className="flex items-center justify-between p-3 border-t border-border/50">
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
            className="text-xs h-8 px-4 bg-muran-primary hover:bg-muran-primary/90 text-white disabled:opacity-50"
          >
            Aplicar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}