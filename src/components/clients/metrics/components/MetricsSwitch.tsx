
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MetricsSwitchProps {
  selectedMetrics: {
    mrr: boolean;
    clients: boolean;
    churn: boolean;
    churnRate: boolean;
    newClients: boolean;
  };
  onMetricChange: (metric: string, checked: boolean) => void;
}

export const MetricsSwitch = ({ selectedMetrics, onMetricChange }: MetricsSwitchProps) => {
  return (
    <ScrollArea className="w-full p-4 border rounded-lg">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="mrr"
            checked={selectedMetrics.mrr}
            onCheckedChange={(checked) => onMetricChange('mrr', checked)}
          />
          <Label htmlFor="mrr">Receita Mensal</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="clients"
            checked={selectedMetrics.clients}
            onCheckedChange={(checked) => onMetricChange('clients', checked)}
          />
          <Label htmlFor="clients">Total de Clientes</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="churn"
            checked={selectedMetrics.churn}
            onCheckedChange={(checked) => onMetricChange('churn', checked)}
          />
          <Label htmlFor="churn">Clientes Cancelados</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="churnRate"
            checked={selectedMetrics.churnRate}
            onCheckedChange={(checked) => onMetricChange('churnRate', checked)}
          />
          <Label htmlFor="churnRate">Churn Rate</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="newClients"
            checked={selectedMetrics.newClients}
            onCheckedChange={(checked) => onMetricChange('newClients', checked)}
          />
          <Label htmlFor="newClients">Clientes Adquiridos</Label>
        </div>
      </div>
    </ScrollArea>
  );
};
