
import { Card } from "@/components/ui/card";
import { FinancialMetrics } from "../FinancialMetrics";
import { BarChart3 } from "lucide-react";

export const ClientsMetricsTab = () => {
  return (
    <Card className="border border-gray-100 shadow-sm">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-muran-primary/10 rounded-lg">
            <BarChart3 className="h-5 w-5 text-muran-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-muran-dark">Métricas Financeiras</h2>
            <p className="text-gray-600 text-sm">Análise detalhada de performance e tendências</p>
          </div>
        </div>
        
        <FinancialMetrics />
      </div>
    </Card>
  );
};
