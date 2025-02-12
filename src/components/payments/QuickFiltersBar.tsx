
import { Button } from "@/components/ui/button";
import { Users, DollarSign, AlertCircle, FilterX } from "lucide-react";

interface QuickFiltersBarProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

export function QuickFiltersBar({ activeFilter, onFilterChange }: QuickFiltersBarProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">Filtros rápidos:</p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant={activeFilter === 'paid' ? 'default' : 'outline'}
          size="sm"
          className="gap-2"
          onClick={() => onFilterChange('paid')}
        >
          <DollarSign className="h-4 w-4" />
          Pagamento recebido
        </Button>

        <Button
          variant={activeFilter === 'pending' ? 'default' : 'outline'}
          size="sm"
          className="gap-2"
          onClick={() => onFilterChange('pending')}
        >
          <AlertCircle className="h-4 w-4" />
          Aguardando pagamento
        </Button>

        <Button
          variant={activeFilter === 'active' ? 'default' : 'outline'}
          size="sm"
          className="gap-2"
          onClick={() => onFilterChange('active')}
        >
          <Users className="h-4 w-4" />
          Clientes ativos
        </Button>

        {activeFilter && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => onFilterChange('')}
          >
            <FilterX className="h-4 w-4" />
            Limpar filtros
          </Button>
        )}
      </div>
    </div>
  );
}
