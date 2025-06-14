
import { BarChart3, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DashboardHeaderProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export const DashboardHeader = ({ 
  onToggleSidebar, 
  sidebarOpen 
}: DashboardHeaderProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        {/* Título e Descrição */}
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-muran-primary to-muran-primary/80 rounded-xl shadow-lg">
            <BarChart3 className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-muran-dark flex items-center gap-3">
              Dashboard Financeiro
              <Badge variant="secondary" className="bg-muran-primary/10 text-muran-primary">
                Tempo Real
              </Badge>
            </h1>
            <p className="text-lg text-gray-600 mt-1">
              Análise completa dos indicadores financeiros da Muran Digital
            </p>
          </div>
        </div>

        {/* Controles */}
        <div className="flex items-center gap-3">
          {/* Botão de Filtros */}
          <Button
            variant={sidebarOpen ? 'default' : 'outline'}
            onClick={onToggleSidebar}
            className={sidebarOpen ? 'bg-muran-primary hover:bg-muran-primary/90' : 'border-muran-primary text-muran-primary hover:bg-muran-primary/10'}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
        </div>
      </div>
    </div>
  );
};
