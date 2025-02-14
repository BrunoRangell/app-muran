
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { ColumnToggle } from "../table/ColumnToggle";
import { FilterPopover } from "../table/FilterPopover";
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
  onCreateClick
}: ClientsHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-bold">Lista de Clientes</h2>
      <div className="flex gap-2 items-center">
        <ColumnToggle 
          columns={columns.filter(col => !col.fixed)} 
          onToggleColumn={onToggleColumn} 
        />
        <FilterPopover 
          filters={filters}
          onFilterChange={onFilterChange}
        />
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
  );
};
