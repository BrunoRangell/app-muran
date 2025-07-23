
import { useState } from "react";
import { CostFilters } from "@/types/cost";
import { UnifiedDashboard } from "@/components/financial-dashboard/UnifiedDashboard";
import { FiltersSidebar } from "@/components/financial-dashboard/FiltersSidebar";
import { DashboardHeader } from "@/components/financial-dashboard/DashboardHeader";
import { ExportTools } from "@/components/financial-dashboard/ExportTools";
import { TeamMemberCheck } from "@/components/auth/TeamMemberCheck";
import { useFinancialData } from "@/hooks/useFinancialData";
import { AlertCircle } from "lucide-react";

const FinancialReport = () => {
  const [filters, setFilters] = useState<CostFilters>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: financialData, isLoading, error } = useFinancialData();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-muran-secondary/20 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-muran-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando relatório financeiro...</p>
        </div>
      </div>
    );
  }

  if (error || !financialData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-muran-secondary/20 to-white flex items-center justify-center">
        <div className="flex flex-col items-center justify-center p-8 text-red-500 gap-4">
          <AlertCircle className="h-12 w-12" />
          <h2 className="text-xl font-semibold">Erro ao carregar relatório</h2>
          <p className="text-center text-gray-600">
            Não foi possível carregar os dados financeiros.
            <br />
            Por favor, tente novamente mais tarde.
          </p>
        </div>
      </div>
    );
  }

  return (
    <TeamMemberCheck>
      <div className="min-h-screen bg-gradient-to-br from-muran-secondary/20 to-white">
        {/* Sidebar de Filtros */}
        <FiltersSidebar 
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          filters={filters}
          onFiltersChange={setFilters}
        />

        {/* Conteúdo Principal */}
        <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-80' : 'ml-0'}`}>
          <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
            {/* Header do Dashboard */}
            <DashboardHeader 
              onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
              sidebarOpen={sidebarOpen}
            />

            {/* Ferramentas de Exportação */}
            <ExportTools filters={filters} />

            {/* Dashboard Unificado */}
            <UnifiedDashboard 
              filters={filters} 
              financialData={financialData}
            />
          </div>
        </div>
      </div>
    </TeamMemberCheck>
  );
};

export default FinancialReport;
