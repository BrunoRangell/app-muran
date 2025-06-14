
import { Button } from "@/components/ui/button";
import { Plus, Download, Filter } from "lucide-react";

interface ClientsHeaderProps {
  onCreateClick?: () => void;
  onExportClick?: () => void;
  onFilterClick?: () => void;
}

export const ClientsHeader = ({ 
  onCreateClick, 
  onExportClick, 
  onFilterClick 
}: ClientsHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold text-muran-dark mb-2">
          Gestão de Clientes
        </h1>
        <p className="text-gray-600">
          Gerencie seus clientes, acompanhe métricas e visualize o desempenho
        </p>
      </div>
      
      <div className="flex items-center gap-3">
        <Button 
          variant="outline" 
          onClick={onFilterClick}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filtros
        </Button>
        
        <Button 
          variant="outline" 
          onClick={onExportClick}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Exportar
        </Button>
        
        <Button 
          onClick={onCreateClick}
          className="bg-muran-primary hover:bg-muran-primary/90 gap-2"
        >
          <Plus className="h-4 w-4" />
          Novo Cliente
        </Button>
      </div>
    </div>
  );
};
