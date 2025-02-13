
import { Trophy, TrendingUp, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Client } from "../types";
import { calculateRetention } from "../table/utils";
import { formatCurrency } from "@/utils/formatters";

interface RankingMetricsProps {
  clients: Client[];
  onMetricChange: (metric: 'revenue' | 'retention') => void;
  selectedMetric: 'revenue' | 'retention';
}

export const RankingMetrics = ({ clients, onMetricChange, selectedMetric }: RankingMetricsProps) => {
  // Calcula os totais para cada métrica
  const totalRevenue = clients
    .filter(client => client.status === 'active')
    .reduce((sum, client) => sum + client.contract_value, 0);

  const avgRetention = clients
    .filter(client => client.status === 'active')
    .reduce((sum, client) => sum + calculateRetention(client), 0) / 
    clients.filter(client => client.status === 'active').length || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <Button
        variant={selectedMetric === 'revenue' ? 'default' : 'outline'}
        className="flex items-center justify-between p-4 h-auto"
        onClick={() => onMetricChange('revenue')}
      >
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <div className="text-left">
            <p className="font-semibold">Ranking por Receita</p>
            <p className="text-sm text-muted-foreground">
              Receita total: {formatCurrency(totalRevenue)}
            </p>
          </div>
        </div>
        <TrendingUp className={`h-5 w-5 ${selectedMetric === 'revenue' ? 'text-white' : 'text-muran-primary'}`} />
      </Button>

      <Button
        variant={selectedMetric === 'retention' ? 'default' : 'outline'}
        className="flex items-center justify-between p-4 h-auto"
        onClick={() => onMetricChange('retention')}
      >
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-500" />
          <div className="text-left">
            <p className="font-semibold">Ranking por Retenção</p>
            <p className="text-sm text-muted-foreground">
              Média de retenção: {avgRetention.toFixed(1)} meses
            </p>
          </div>
        </div>
        <TrendingUp className={`h-5 w-5 ${selectedMetric === 'retention' ? 'text-white' : 'text-muran-primary'}`} />
      </Button>
    </div>
  );
};
