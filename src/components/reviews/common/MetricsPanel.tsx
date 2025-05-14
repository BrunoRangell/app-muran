
import { Card, CardContent } from '@/components/ui/card';
import { TrendingDown, TrendingUp, DollarSign, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  // Calcular o orçamento disponível
  const availableBudget = metrics.totalBudget - metrics.totalSpent;
  const availablePercentage = 100 - metrics.spentPercentage;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Orçamento Total</h3>
              <div className="mt-1">
                <span className="text-2xl font-bold">{formatCurrency(metrics.totalBudget)}</span>
                <div className="flex items-center mt-1">
                  <span className="text-sm text-gray-500">
                    {formatCurrency(metrics.totalSpent)} gasto ({Math.round(metrics.spentPercentage)}%)
                  </span>
                </div>
              </div>
            </div>
            <DollarSign className="h-8 w-8 text-[#ff6e00] bg-orange-50 p-1 rounded-full" />
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-[#ff6e00] h-2 rounded-full"
                style={{ width: `${Math.min(metrics.spentPercentage, 100)}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Orçamento Disponível</h3>
              <div className="mt-1">
                <span className="text-2xl font-bold">{formatCurrency(availableBudget)}</span>
                <div className="flex items-center mt-1">
                  <span className="text-sm text-gray-500">
                    {metrics.availablePercentage}% disponível
                  </span>
                </div>
              </div>
            </div>
            {availablePercentage > 70 ? (
              <TrendingUp className="h-8 w-8 text-green-500 bg-green-50 p-1 rounded-full" />
            ) : availablePercentage > 30 ? (
              <TrendingUp className="h-8 w-8 text-yellow-500 bg-yellow-50 p-1 rounded-full" />
            ) : (
              <TrendingDown className="h-8 w-8 text-red-500 bg-red-50 p-1 rounded-full" />
            )}
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  availablePercentage > 70 
                    ? 'bg-green-500' 
                    : availablePercentage > 30 
                      ? 'bg-yellow-500' 
                      : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(availablePercentage, 100)}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Clientes com Revisão</h3>
              <div className="mt-1">
                <span className="text-2xl font-bold">{metrics.totalClients}</span>
                <div className="flex items-center mt-1">
                  <span className="text-sm text-gray-500">
                    {metrics.clientsNeedingAdjustment} precisam de ajustes
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Button 
              onClick={onBatchReview} 
              disabled={isProcessing}
              className="w-full bg-[#ff6e00] hover:bg-[#e66300] text-white"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                'Analisar Todos'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
