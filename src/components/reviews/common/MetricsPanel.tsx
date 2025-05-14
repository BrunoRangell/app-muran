
import { Card, CardContent, CardFooter, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

interface MetricsPanelProps {
  metrics: {
    totalClients: number;
    clientsNeedingAdjustment: number;
    totalBudget: number;
    totalSpent: number;
    spentPercentage: number;
  };
  onBatchReview: () => void;
  isProcessing: boolean;
}

export function MetricsPanel({ metrics, onBatchReview, isProcessing }: MetricsPanelProps) {
  // Calcular métricas derivadas
  const availableBudget = metrics.totalBudget - metrics.totalSpent;
  const availablePercentage = metrics.totalBudget > 0 
    ? 100 - metrics.spentPercentage 
    : 0;
  
  return (
    <Card className="bg-white">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total de clientes
            </CardTitle>
            <div>
              <span className="text-2xl font-bold">{metrics.totalClients}</span>
              <div className="flex items-center mt-1">
                <span className="text-sm text-gray-500">
                  {metrics.clientsNeedingAdjustment} precisam de ajuste
                </span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Orçamento total
            </CardTitle>
            <div>
              <span className="text-2xl font-bold">{formatCurrency(metrics.totalBudget)}</span>
              <div className="flex items-center mt-1">
                <span className="text-sm text-gray-500">
                  investimento mensal
                </span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Valor gasto
            </CardTitle>
            <div>
              <span className="text-2xl font-bold">{formatCurrency(metrics.totalSpent)}</span>
              <div className="flex items-center mt-1">
                <span className="text-sm text-gray-500">
                  {metrics.spentPercentage.toFixed(1)}% utilizado
                </span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Saldo disponível
            </CardTitle>
            <div>
              <span className="text-2xl font-bold">{formatCurrency(availableBudget)}</span>
              <div className="flex items-center mt-1">
                <span className="text-sm text-gray-500">
                  {availablePercentage.toFixed(1)}% disponível
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-2 pb-4">
        <Button
          variant="default"
          className="bg-[#ff6e00] hover:bg-[#e66300] ml-auto"
          onClick={onBatchReview}
          disabled={isProcessing || metrics.totalClients === 0}
        >
          {isProcessing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Analisando...
            </>
          ) : (
            'Analisar Todos'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
