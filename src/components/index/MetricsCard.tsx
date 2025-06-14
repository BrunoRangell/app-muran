
import { UnifiedMetricCard } from "@/components/common/UnifiedMetricCard";
import { UnifiedDashboardGrid } from "@/components/common/UnifiedDashboardGrid";
import { TrendingUp, Users, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MetricsCardProps {
  clientMetrics: {
    activeCount: number;
    newCount: number;
  } | undefined;
}

export const MetricsCard = ({ clientMetrics }: MetricsCardProps) => {
  return (
    <Card className="border-0 shadow-sm hover:scale-105 transition-transform duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
          <TrendingUp className="text-muran-primary" />
          Métricas de Sucesso
        </CardTitle>
      </CardHeader>
      <CardContent>
        <UnifiedDashboardGrid variant="cards">
          <UnifiedMetricCard
            title="Clientes ativos"
            value={clientMetrics?.activeCount || 0}
            icon={Users}
            color="text-muran-primary"
            variant="compact"
          />
          
          <UnifiedMetricCard
            title="Novos clientes este mês"
            value={clientMetrics?.newCount || 0}
            icon={UserPlus}
            color="text-muran-primary"
            variant="compact"
          />
        </UnifiedDashboardGrid>
      </CardContent>
    </Card>
  );
};
