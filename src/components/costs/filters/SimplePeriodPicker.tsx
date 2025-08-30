import { useState } from "react";
import { CalendarIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CostFilters } from "@/types/cost";
import { formatDateToBrazilTimezone, getTodayInBrazil } from "@/utils/brazilTimezone";
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";

interface SimplePeriodPickerProps {
  filters: CostFilters;
  onFiltersChange: (filters: CostFilters) => void;
}

export function SimplePeriodPicker({ filters, onFiltersChange }: SimplePeriodPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState(filters.startDate || "");
  const [endDate, setEndDate] = useState(filters.endDate || "");

  const handleApply = () => {
    const newFilters = { ...filters };
    
    if (startDate) {
      newFilters.startDate = startDate;
    } else {
      delete newFilters.startDate;
    }
    
    if (endDate) {
      newFilters.endDate = endDate;
    } else {
      delete newFilters.endDate;
    }
    
    onFiltersChange(newFilters);
    setIsOpen(false);
  };

  const handleClear = () => {
    setStartDate("");
    setEndDate("");
    const newFilters = { ...filters };
    delete newFilters.startDate;
    delete newFilters.endDate;
    onFiltersChange(newFilters);
    setIsOpen(false);
  };

  const handleQuickSelect = (type: string) => {
    const today = new Date();
    let start: string;
    let end: string;

    switch (type) {
      case 'last7days':
        start = formatDateToBrazilTimezone(subDays(today, 6));
        end = getTodayInBrazil();
        break;
      case 'last30days':
        start = formatDateToBrazilTimezone(subDays(today, 29));
        end = getTodayInBrazil();
        break;
      case 'thisMonth':
        start = formatDateToBrazilTimezone(startOfMonth(today));
        end = formatDateToBrazilTimezone(endOfMonth(today));
        break;
      case 'lastMonth':
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        start = formatDateToBrazilTimezone(startOfMonth(lastMonth));
        end = formatDateToBrazilTimezone(endOfMonth(lastMonth));
        break;
      case 'thisYear':
        start = formatDateToBrazilTimezone(startOfYear(today));
        end = formatDateToBrazilTimezone(endOfYear(today));
        break;
      default:
        return;
    }

    setStartDate(start);
    setEndDate(end);
  };

  const formatCurrentSelection = () => {
    if (filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      return `${format(start, "dd/MM")} - ${format(end, "dd/MM/yyyy")}`;
    }
    if (filters.startDate) {
      return `A partir de ${format(new Date(filters.startDate), "dd/MM/yyyy")}`;
    }
    if (filters.endDate) {
      return `Até ${format(new Date(filters.endDate), "dd/MM/yyyy")}`;
    }
    return "Período personalizado";
  };

  const hasActiveFilter = filters.startDate || filters.endDate;

  const quickOptions = [
    { key: 'last7days', label: 'Últimos 7 dias' },
    { key: 'last30days', label: 'Últimos 30 dias' },
    { key: 'thisMonth', label: 'Este mês' },
    { key: 'lastMonth', label: 'Mês passado' },
    { key: 'thisYear', label: 'Este ano' },
  ];

  const isValid = !startDate || !endDate || startDate <= endDate;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`h-9 px-3 text-sm font-medium border-muran-primary/20 hover:bg-muran-primary/5 hover:border-muran-primary/40 transition-colors ${
            hasActiveFilter ? "bg-muran-primary/10 border-muran-primary/30" : ""
          }`}
        >
          <CalendarIcon className="h-4 w-4 mr-2" />
          {formatCurrentSelection()}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="start">
        {/* Header */}
        <div className="p-4 border-b border-border/50">
          <h4 className="text-sm font-medium text-foreground mb-3">Período Personalizado</h4>
          
          {/* Campos de data */}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="startDate" className="text-xs text-muted-foreground">
                Data inicial
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="endDate" className="text-xs text-muted-foreground">
                Data final
              </Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {!isValid && (
            <p className="text-xs text-destructive mt-2">
              A data inicial deve ser anterior à data final
            </p>
          )}
        </div>

        {/* Preview */}
        {(startDate || endDate) && isValid && (
          <div className="px-4 py-2 bg-muted/30 border-b border-border/50">
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Período selecionado:</span>{" "}
              {startDate && endDate ? (
                `${format(new Date(startDate), "dd/MM")} - ${format(new Date(endDate), "dd/MM/yyyy")}`
              ) : startDate ? (
                `A partir de ${format(new Date(startDate), "dd/MM/yyyy")}`
              ) : (
                `Até ${format(new Date(endDate), "dd/MM/yyyy")}`
              )}
            </div>
          </div>
        )}

        {/* Botões de ação */}
        <div className="flex items-center justify-between p-4">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClear}
            className="text-xs h-8 px-3 hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-3 w-3 mr-1" />
            Limpar
          </Button>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="text-xs h-8 px-3"
            >
              Cancelar
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
        </div>
      </PopoverContent>
    </Popover>
  );
}