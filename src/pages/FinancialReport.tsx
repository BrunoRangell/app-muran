
import { useState } from "react";
import { CostFilters } from "@/types/cost";
import { UnifiedDashboard } from "@/components/financial-dashboard/UnifiedDashboard";
import { FiltersSidebar } from "@/components/financial-dashboard/FiltersSidebar";
import { DashboardHeader } from "@/components/financial-dashboard/DashboardHeader";
import { ExportTools } from "@/components/financial-dashboard/ExportTools";

const FinancialReport = () => {
  const [filters, setFilters] = useState<CostFilters>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
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
          <UnifiedDashboard filters={filters} />
        </div>
      </div>
    </div>
  );
};

export default FinancialReport;
