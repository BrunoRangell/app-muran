import { Card } from "@/components/ui/card";
import { CostFilters } from "@/types/cost";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
interface TrendAnalysisProps {
  filters: CostFilters;
}
export const TrendAnalysis = ({
  filters
}: TrendAnalysisProps) => {
  const trends = [{
    category: 'Crescimento',
    metrics: [{
      name: 'MRR',
      progress: 78,
      target: 'R$ 150k',
      status: 'Em andamento'
    }, {
      name: 'Base de Clientes',
      progress: 65,
      target: '200 clientes',
      status: 'Em andamento'
    }, {
      name: 'Ticket Médio',
      progress: 45,
      target: 'R$ 2.5k',
      status: 'Atrasado'
    }]
  }, {
    category: 'Eficiência',
    metrics: [{
      name: 'Redução CAC',
      progress: 85,
      target: 'R$ 1.1k',
      status: 'Adiantado'
    }, {
      name: 'Melhoria Churn',
      progress: 40,
      target: '2%',
      status: 'Atrasado'
    }, {
      name: 'Margem de Lucro',
      progress: 70,
      target: '25%',
      status: 'Em andamento'
    }]
  }];
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Adiantado':
        return 'bg-green-100 text-green-800';
      case 'Em andamento':
        return 'bg-blue-100 text-blue-800';
      case 'Atrasado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  return;
};