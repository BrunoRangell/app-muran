
import { Card } from "@/components/ui/card";
import { CostFilters } from "@/types/cost";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target } from "lucide-react";

interface TrendAnalysisProps {
  filters: CostFilters;
}

export const TrendAnalysis = ({ filters }: TrendAnalysisProps) => {
  const trends = [
    {
      category: 'Crescimento',
      metrics: [
        {
          name: 'MRR',
          progress: 78,
          target: 'R$ 150k',
          status: 'Em andamento'
        },
        {
          name: 'Base de Clientes',
          progress: 65,
          target: '200 clientes',
          status: 'Em andamento'
        },
        {
          name: 'Ticket Médio',
          progress: 45,
          target: 'R$ 2.5k',
          status: 'Atrasado'
        }
      ]
    },
    {
      category: 'Eficiência',
      metrics: [
        {
          name: 'Redução CAC',
          progress: 85,
          target: 'R$ 1.1k',
          status: 'Adiantado'
        },
        {
          name: 'Melhoria Churn',
          progress: 40,
          target: '2%',
          status: 'Atrasado'
        },
        {
          name: 'Margem de Lucro',
          progress: 70,
          target: '25%',
          status: 'Em andamento'
        }
      ]
    }
  ];

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

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className="p-6 border-l-4 border-l-green-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-100 rounded-lg">
          <Target className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-muran-dark">Análise de Tendências</h3>
          <p className="text-gray-600">Progresso em direção às metas</p>
        </div>
      </div>

      <div className="space-y-6">
        {trends.map((trend, trendIndex) => (
          <div key={trendIndex}>
            <h4 className="text-lg font-semibold text-muran-dark mb-4">{trend.category}</h4>
            <div className="space-y-4">
              {trend.metrics.map((metric, metricIndex) => (
                <div key={metricIndex} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-muran-dark">{metric.name}</span>
                      <Badge className={`text-xs ${getStatusColor(metric.status)}`}>
                        {metric.status}
                      </Badge>
                    </div>
                    <span className="text-sm text-gray-600">Meta: {metric.target}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <Progress 
                        value={metric.progress} 
                        className="h-2"
                        indicatorClassName={getProgressColor(metric.progress)}
                      />
                    </div>
                    <span className="text-sm font-medium text-muran-dark min-w-[3rem]">
                      {metric.progress}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
