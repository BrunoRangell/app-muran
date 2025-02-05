import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface MetricsCardProps {
  clientMetrics: {
    activeCount: number;
    newCount: number;
  } | undefined;
}

export const MetricsCard = ({ clientMetrics }: MetricsCardProps) => {
  return (
    <Card className="shadow-lg border-t-4 border-muran-primary hover:scale-105 transition-transform duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
          <TrendingUp className="text-muran-primary" />
          Métricas de Sucesso
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <span className="font-medium">Clientes ativos</span>
            <span className="text-muran-primary font-bold text-xl">
              {clientMetrics?.activeCount || 0}
            </span>
          </div>
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <span className="font-medium">Novos clientes este mês</span>
            <span className="text-muran-primary font-bold text-xl">
              {clientMetrics?.newCount || 0}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};