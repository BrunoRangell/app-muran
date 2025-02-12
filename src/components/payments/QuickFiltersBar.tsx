
import { Button } from "@/components/ui/button";
import { Users, DollarSign, AlertCircle } from "lucide-react";

interface QuickFiltersBarProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

export function QuickFiltersBar({ activeFilter, onFilterChange }: QuickFiltersBarProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <Button
        variant={activeFilter === 'active' ? 'default' : 'outline'}
        size="sm"
        className="gap-2"
        onClick={() => onFilterChange('active')}
      >
        <Users className="h-4 w-4" />
        Clientes ativos
      </Button>

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
    </div>
  );
}
