import { Card } from "@/components/ui/card";
import { CostFilters } from "@/types/cost";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
interface ComparativeAnalysisProps {
  filters: CostFilters;
}
export const ComparativeAnalysis = ({
  filters
}: ComparativeAnalysisProps) => {
  const comparisons = [{
    metric: 'MRR',
    current: 'R$ 125.400',
    previous: 'R$ 108.500',
    change: 15.6,
    isPositive: true
  }, {
    metric: 'Churn Rate',
    current: '3.2%',
    previous: '2.4%',
    change: 8.3,
    isPositive: false
  }, {
    metric: 'Novos Clientes',
    current: '12',
    previous: '8',
    change: 50.0,
    isPositive: true
  }, {
    metric: 'CAC',
    current: 'R$ 1.250',
    previous: 'R$ 1.360',
    change: -8.1,
    isPositive: true
  }];
  const getTrendIcon = (change: number) => {
    if (change > 0) return TrendingUp;
    if (change < 0) return TrendingDown;
    return Minus;
  };
  const getTrendColor = (isPositive: boolean) => {
    return isPositive ? 'text-green-600' : 'text-red-600';
  };
  return;
};