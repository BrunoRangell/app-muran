
import { Card } from "@/components/ui/card";
import { CostFilters } from "@/types/cost";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target } from "lucide-react";
import { useFinancialMetrics } from "@/components/clients/metrics/hooks/useFinancialMetrics";

interface TrendAnalysisProps {
  filters: CostFilters;
}

export const TrendAnalysis = ({ filters }: TrendAnalysisProps) => {
  const { allClientsMetrics, isLoadingAllClients } = useFinancialMetrics();

  if (isLoadingAllClients || !allClientsMetrics) {
    return (
      <Card className="p-6 border-l-4 border-l-green-500">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Calculate intelligent goals based on current metrics and industry benchmarks
  const mrrTarget = allClientsMetrics.mrr * 1.5; // 50% growth target
  const clientsTarget = Math.ceil(allClientsMetrics.activeClientsCount * 1.3); // 30% growth target
  const averageTicketTarget = allClientsMetrics.averageTicket * 1.2; // 20% improvement target
  const cacTarget = allClientsMetrics.cac * 0.8; // 20% reduction target
  const churnTarget = 2; // Industry benchmark: 2%
  const marginTarget = 25; // Industry benchmark: 25%

  const currentMargin = allClientsMetrics.mrr > 0 
    ? ((allClientsMetrics.mrr - allClientsMetrics.totalCosts) / allClientsMetrics.mrr) * 100 
    : 0;

  const trends = [
    {
      category: 'Crescimento',
      metrics: [
        {
          name: 'MRR',
          progress: Math.min((allClientsMetrics.mrr / mrrTarget) * 100, 100),
          target: formatCurrency(mrrTarget),
          status: allClientsMetrics.mrr >= mrrTarget * 0.8 ? 'Adiantado' : 
                  allClientsMetrics.mrr >= mrrTarget * 0.6 ? 'Em andamento' : 'Atrasado'
        },
        {
          name: 'Base de Clientes',
          progress: Math.min((allClientsMetrics.activeClientsCount / clientsTarget) * 100, 100),
          target: `${clientsTarget} clientes`,
          status: allClientsMetrics.activeClientsCount >= clientsTarget * 0.8 ? 'Adiantado' : 
                  allClientsMetrics.activeClientsCount >= clientsTarget * 0.6 ? 'Em andamento' : 'Atrasado'
        },
        {
          name: 'Ticket Médio',
          progress: Math.min((allClientsMetrics.averageTicket / averageTicketTarget) * 100, 100),
          target: formatCurrency(averageTicketTarget),
          status: allClientsMetrics.averageTicket >= averageTicketTarget * 0.8 ? 'Adiantado' : 
                  allClientsMetrics.averageTicket >= averageTicketTarget * 0.6 ? 'Em andamento' : 'Atrasado'
        }
      ]
    },
    {
      category: 'Eficiência',
      metrics: [
        {
          name: 'Redução CAC',
          progress: Math.min(((allClientsMetrics.cac > 0 ? cacTarget / allClientsMetrics.cac : 1) * 100), 100),
          target: formatCurrency(cacTarget),
          status: allClientsMetrics.cac <= cacTarget * 1.2 ? 'Adiantado' : 
                  allClientsMetrics.cac <= cacTarget * 1.5 ? 'Em andamento' : 'Atrasado'
        },
        {
          name: 'Melhoria Churn',
          progress: Math.min(((churnTarget / Math.max(allClientsMetrics.churnRate, 0.1)) * 100), 100),
          target: '2%',
          status: allClientsMetrics.churnRate <= churnTarget * 1.2 ? 'Adiantado' : 
                  allClientsMetrics.churnRate <= churnTarget * 2 ? 'Em andamento' : 'Atrasado'
        },
        {
          name: 'Margem de Lucro',
          progress: Math.min((currentMargin / marginTarget) * 100, 100),
          target: '25%',
          status: currentMargin >= marginTarget * 0.8 ? 'Adiantado' : 
                  currentMargin >= marginTarget * 0.6 ? 'Em andamento' : 'Atrasado'
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
