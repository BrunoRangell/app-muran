
import { BarChart3 } from "lucide-react";
import { UnifiedDashboard } from "@/components/financial-dashboard/UnifiedDashboard";

const FinancialReport = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-muran-secondary/5 to-background">
      <div className="max-w-7xl mx-auto p-3 md:p-4 space-y-4">
        {/* Header Minimalista */}
        <div className="flex items-center gap-3 py-2">
          <div className="p-2 bg-muran-primary/10 rounded-lg">
            <BarChart3 className="h-6 w-6 text-muran-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-muran-dark">Relatório Financeiro</h1>
            <p className="text-sm text-muted-foreground">Visão geral das métricas da agência</p>
          </div>
        </div>

        {/* Dashboard Unificado */}
        <UnifiedDashboard filters={{}} />
      </div>
    </div>
  );
};

export default FinancialReport;
