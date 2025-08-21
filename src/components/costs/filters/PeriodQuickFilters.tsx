import { Button } from "@/components/ui/button";
import { CostFilters } from "@/types/cost";
import { Badge } from "@/components/ui/badge";
import { ImprovedCustomDatePicker } from "./ImprovedCustomDatePicker";
import { X } from "lucide-react";

interface PeriodQuickFiltersProps {
  filters: CostFilters;
  onFiltersChange: (filters: CostFilters) => void;
}

export function PeriodQuickFilters({ filters, onFiltersChange }: PeriodQuickFiltersProps) {
  const today = new Date();
  
  const setPeriod = (startDate: string, endDate: string) => {
    onFiltersChange({ ...filters, startDate, endDate });
  };

  const clearDateFilters = () => {
    onFiltersChange({ ...filters, startDate: undefined, endDate: undefined });
  };

  const getCurrentMonth = () => {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

  const getLastMonth = () => {
    const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const end = new Date(today.getFullYear(), today.getMonth(), 0);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

  const getLast3Months = () => {
    const start = new Date(today.getFullYear(), today.getMonth() - 2, 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

  const getCurrentYear = () => {
    const start = new Date(today.getFullYear(), 0, 1);
    const end = new Date(today.getFullYear(), 11, 31);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

  const getLastYear = () => {
    const start = new Date(today.getFullYear() - 1, 0, 1);
    const end = new Date(today.getFullYear() - 1, 11, 31);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

  const hasDateFilter = filters.startDate || filters.endDate;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">Filtros Rápidos</h4>
        {hasDateFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearDateFilters}
            className="h-auto p-1 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Limpar
          </Button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => {
            const period = getCurrentMonth();
            setPeriod(period.start, period.end);
          }}
          className="h-9 px-3 text-sm font-medium border-muran-primary/20 hover:bg-muran-primary/5 hover:border-muran-primary/40"
        >
          Este Mês
        </Button>
        
        <Button
          variant="outline"
          onClick={() => {
            const period = getLastMonth();
            setPeriod(period.start, period.end);
          }}
          className="h-9 px-3 text-sm font-medium border-muran-primary/20 hover:bg-muran-primary/5 hover:border-muran-primary/40"
        >
          Mês Passado
        </Button>
        
        <Button
          variant="outline"
          onClick={() => {
            const period = getLast3Months();
            setPeriod(period.start, period.end);
          }}
          className="h-9 px-3 text-sm font-medium border-muran-primary/20 hover:bg-muran-primary/5 hover:border-muran-primary/40"
        >
          Últimos 3 Meses
        </Button>
        
        <Button
          variant="outline"
          onClick={() => {
            const period = getCurrentYear();
            setPeriod(period.start, period.end);
          }}
          className="h-9 px-3 text-sm font-medium border-muran-primary/20 hover:bg-muran-primary/5 hover:border-muran-primary/40"
        >
          Este Ano
        </Button>
        
        <Button
          variant="outline"
          onClick={() => {
            const period = getLastYear();
            setPeriod(period.start, period.end);
          }}
          className="h-9 px-3 text-sm font-medium border-muran-primary/20 hover:bg-muran-primary/5 hover:border-muran-primary/40"
        >
          Ano Passado
        </Button>
        
        <ImprovedCustomDatePicker 
          filters={filters} 
          onFiltersChange={onFiltersChange} 
        />
      </div>

      {hasDateFilter && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {filters.startDate && `De: ${new Date(filters.startDate).toLocaleDateString('pt-BR')}`}
          </Badge>
          {filters.endDate && (
            <Badge variant="secondary" className="text-xs">
              {`Até: ${new Date(filters.endDate).toLocaleDateString('pt-BR')}`}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}