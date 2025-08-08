import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { METRIC_COLORS } from "../constants/metricColors";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface VerticalMetricsFilterProps {
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

export const VerticalMetricsFilter = ({ selectedMetrics, onMetricChange }: VerticalMetricsFilterProps) => {
  const activeCount = Object.values(selectedMetrics).filter(Boolean).length;
  const maxReached = activeCount >= 2;

  return (
    <Card className="p-4 w-full min-w-[220px]">
      <div className="space-y-1 mb-3">
        <h4 className="font-medium text-sm">Métricas</h4>
        <p className="text-xs text-muted-foreground">
          Máximo 2 ativas ({activeCount}/2)
        </p>
      </div>
      
      <div className="space-y-3">
        {METRICS_CONFIG.map(({ key, label, color }) => {
          const isSelected = selectedMetrics[key as keyof typeof selectedMetrics];
          const isDisabled = !isSelected && maxReached;
          
          const metricItem = (
            <div 
              className={`flex items-center justify-between p-2 rounded-md transition-colors ${
                isDisabled ? 'opacity-50' : 'hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <Label 
                  htmlFor={key}
                  className={`text-sm font-medium cursor-pointer ${
                    isDisabled ? 'cursor-not-allowed' : ''
                  }`}
                >
                  {label}
                </Label>
              </div>
              
              <Switch
                id={key}
                checked={isSelected}
                disabled={isDisabled}
                onCheckedChange={(checked) => onMetricChange(key, checked)}
                className="ml-2"
              />
            </div>
          );

          if (isDisabled) {
            return (
              <TooltipProvider key={key}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    {metricItem}
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Máximo de 2 métricas ativas permitidas</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          }

          return <div key={key}>{metricItem}</div>;
        })}
      </div>
    </Card>
  );
};