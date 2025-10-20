import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { ColumnToggle } from "../table/ColumnToggle";
import { Column } from "../types";

interface ClientsHeaderProps {
  columns: Column[];
  filters: {
    status: string;
    acquisition_channel: string;
    payment_type: string;
  };
  hasActiveFilters: boolean;
  onToggleColumn: (columnId: string) => void;
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
  onCreateClick: () => void;
}

export const ClientsHeader = ({
  columns,
  filters,
  hasActiveFilters,
  onToggleColumn,
  onFilterChange,
  onClearFilters,
  onCreateClick,
}: ClientsHeaderProps) => {
  return (
    <div className="mb-6 space-y-4">
      {/* Cabeçalho superior */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-xl font-bold">Lista de Clientes</h2>
        <div className="flex gap-2 items-center">
          <ColumnToggle columns={columns.filter((col) => !col.fixed)} onToggleColumn={onToggleColumn} />
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-9 px-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Limpar filtros
            </Button>
          )}
          <Button onClick={onCreateClick} className="bg-muran-primary hover:bg-muran-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
        </div>
      </div>

      {/* Área de filtros visíveis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
        {/* Filtro: Status */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={filters.status}
            onChange={(e) => onFilterChange("status", e.target.value)}
            className="border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-muran-primary outline-none"
          >
            <option value="">Todos</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </div>

        {/* Filtro: Tipo de Pagamento */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Tipo de Pagamento</label>
          <select
            value={filters.payment_type}
            onChange={(e) => onFilterChange("payment_type", e.target.value)}
            className="border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-muran-primary outline-none"
          >
            <option value="">Todos</option>
            <option value="pré-pago">Pré-pago</option>
            <option value="pós-pago">Pós-pago</option>
          </select>
        </div>

        {/* Filtro: Canal de Aquisição */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Canal de Aquisição</label>
          <select
            value={filters.acquisition_channel}
            onChange={(e) => onFilterChange("acquisition_channel", e.target.value)}
            className="border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-muran-primary outline-none"
          >
            <option value="">Todos</option>
            <option value="indicação">Indicação</option>
            <option value="prospecção fria">Prospecção fria</option>
            <option value="orgânico">Orgânico</option>
            <option value="outros">Outros</option>
          </select>
        </div>
      </div>
    </div>
  );
};
