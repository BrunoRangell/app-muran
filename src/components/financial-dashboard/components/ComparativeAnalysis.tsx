
import { Card } from "@/components/ui/card";
import { CostFilters } from "@/types/cost";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ComparativeAnalysisProps {
  filters: CostFilters;
}

export const ComparativeAnalysis = ({ filters }: ComparativeAnalysisProps) => {
  const comparisons = [
    {
      metric: 'MRR',
      current: 'R$ 125.400',
      previous: 'R$ 108.500',
      change: 15.6,
      isPositive: true
    },
    {
      metric: 'Churn Rate',
      current: '3.2%',
      previous: '2.4%',
      change: 8.3,
      isPositive: false
    },
    {
      metric: 'Novos Clientes',
      current: '12',
      previous: '8',
      change: 50.0,
      isPositive: true
    },
    {
      metric: 'CAC',
      current: 'R$ 1.250',
      previous: 'R$ 1.360',
      change: -8.1,
      isPositive: true
    }
  ];

  const getTrendIcon = (change: number) => {
    if (change > 0) return TrendingUp;
    if (change < 0) return TrendingDown;
    return Minus;
  };

  const getTrendColor = (isPositive: boolean) => {
    return isPositive ? 'text-green-600' : 'text-red-600';
  };

  return (
    <Card className="p-6 border-l-4 border-l-purple-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 rounded-lg">
          <TrendingUp className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-muran-dark">Análise Comparativa</h3>
          <p className="text-gray-600">Comparação com período anterior</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {comparisons.map((comparison, index) => {
          const TrendIcon = getTrendIcon(comparison.change);
          return (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-muran-dark">{comparison.metric}</h4>
                <div className={`flex items-center gap-1 ${getTrendColor(comparison.isPositive)}`}>
                  <TrendIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {comparison.change > 0 ? '+' : ''}{comparison.change}%
                  </span>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Atual:</span>
                  <span className="font-bold text-muran-dark">{comparison.current}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Anterior:</span>
                  <span className="text-gray-600">{comparison.previous}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
