
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
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-muran-dark">Análise Comparativa</h3>
          <p className="text-gray-600">Comparação com o período anterior</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {comparisons.map((item, index) => {
          const TrendIcon = getTrendIcon(item.change);
          return (
            <div key={index} className="p-4 border rounded-lg hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-muran-dark">{item.metric}</h4>
                <Badge 
                  variant="outline" 
                  className={getTrendColor(item.isPositive)}
                >
                  <TrendIcon className="h-3 w-3 mr-1" />
                  {Math.abs(item.change)}%
                </Badge>
              </div>
              
              <div className="space-y-1">
                <div className="text-2xl font-bold text-muran-dark">
                  {item.current}
                </div>
                <div className="text-sm text-gray-500">
                  vs {item.previous} (período anterior)
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
