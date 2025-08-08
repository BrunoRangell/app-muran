
import { Card } from "@/components/ui/card";
import { BarChart3, TrendingUp } from "lucide-react";
import { FinancialSection } from "@/components/financial-dashboard/sections/FinancialSection";
import { ClientsSection } from "@/components/financial-dashboard/sections/ClientsSection";
import { CostsSection } from "@/components/financial-dashboard/sections/CostsSection";
import { PerformanceSection } from "@/components/financial-dashboard/sections/PerformanceSection";

const FinancialReport = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 space-y-4">
        {/* Header Compacto */}
        <Card className="p-4 border-l-4 border-l-muran-primary">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muran-primary/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-muran-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Relatório Financeiro</h1>
              <p className="text-muted-foreground">Visão geral das métricas financeiras</p>
            </div>
          </div>
        </Card>

        {/* Grid Otimizado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FinancialSection filters={{}} />
          <ClientsSection filters={{}} />
          <CostsSection filters={{}} />
          <PerformanceSection filters={{}} />
        </div>
      </div>
    </div>
  );
};

export default FinancialReport;
