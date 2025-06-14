
import { Card } from "@/components/ui/card";
import { CostFilters } from "@/types/cost";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface TrendAnalysisProps {
  filters: CostFilters;
}

export const TrendAnalysis = ({ filters }: TrendAnalysisProps) => {
  const trends = [
    {
      category: 'Crescimento',
      metrics: [
        { name: 'MRR', progress: 78, target: 'R$ 150k', status: 'Em andamento' },
        { name: 'Base de Clientes', progress: 65, target: '200 clientes', status: 'Em andamento' },
        { name: 'Ticket Médio', progress: 45, target: 'R$ 2.5k', status: 'Atrasado' }
      ]
    },
    {
      category: 'Eficiência',
      metrics: [
        { name: 'Redução CAC', progress: 85, target: 'R$ 1.1k', status: 'Adiantado' },
        { name: 'Melhoria Churn', progress: 40, target: '2%', status: 'Atrasado' },
        { name: 'Margem de Lucro', progress: 70, target: '25%', status: 'Em andamento' }
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

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 rounded-lg">
          <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-muran-dark">Análise de Tendências e Metas</h3>
          <p className="text-gray-600">Progresso em direção aos objetivos estratégicos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {trends.map((category, categoryIndex) => (
          <div key={categoryIndex} className="space-y-4">
            <h4 className="text-lg font-semibold text-muran-dark border-b pb-2">
              {category.category}
            </h4>
            
            <div className="space-y-4">
              {category.metrics.map((metric, metricIndex) => (
                <div key={metricIndex} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-muran-dark">{metric.name}</span>
                    <Badge className={getStatusColor(metric.status)}>
                      {metric.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Progresso</span>
                      <span>{metric.progress}%</span>
                    </div>
                    <Progress value={metric.progress} className="h-2" />
                    <div className="text-sm text-gray-500">
                      Meta: {metric.target}
                    </div>
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
