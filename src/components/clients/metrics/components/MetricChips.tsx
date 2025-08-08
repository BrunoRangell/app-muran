import { Badge } from "@/components/ui/badge";
import { METRIC_COLORS } from "../constants/metricColors";

interface MetricChipsProps {
  selectedMetrics: {
    mrr: boolean;
    clients: boolean;
    churn: boolean;
    newClients: boolean;
  };
  onMetricChange: (metric: string, checked: boolean) => void;
}

const METRICS_CONFIG = [
  { key: 'mrr', label: 'Receita Mensal', color: METRIC_COLORS.mrr },
  { key: 'clients', label: 'Clientes Ativos', color: METRIC_COLORS.clients },
  { key: 'newClients', label: 'Novos Clientes', color: METRIC_COLORS.newClients },
  { key: 'churn', label: 'Churn', color: METRIC_COLORS.churn },
];

export const MetricChips = ({ selectedMetrics, onMetricChange }: MetricChipsProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {METRICS_CONFIG.map(({ key, label, color }) => {
        const isSelected = selectedMetrics[key as keyof typeof selectedMetrics];
        
        return (
          <Badge
            key={key}
            variant={isSelected ? "default" : "outline"}
            className={`
              cursor-pointer transition-all duration-200 px-3 py-1.5 text-xs font-medium
              hover:scale-105 select-none border-2
              ${isSelected 
                ? 'border-transparent shadow-sm' 
                : 'border-border/50 hover:border-border'
              }
            `}
            style={{
              backgroundColor: isSelected ? color : 'transparent',
              color: isSelected ? '#ffffff' : color,
              borderColor: isSelected ? color : undefined,
            }}
            onClick={() => onMetricChange(key, !isSelected)}
          >
            <div 
              className="w-2 h-2 rounded-full mr-2 flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            {label}
          </Badge>
        );
      })}
    </div>
  );
};