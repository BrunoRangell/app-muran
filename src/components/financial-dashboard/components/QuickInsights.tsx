
import { Card } from "@/components/ui/card";
import { TrendingUp, AlertCircle, CheckCircle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CostFilters } from "@/types/cost";

interface QuickInsightsProps {
  filters: CostFilters;
}

export const QuickInsights = ({ filters }: QuickInsightsProps) => {
  const insights = [
    {
      type: 'success',
      icon: CheckCircle,
      title: 'Crescimento Saudável',
      message: 'MRR cresceu 15.7% no último mês, superando a meta de 10%',
      priority: 'high'
    },
    {
      type: 'warning',
      icon: AlertCircle,
      title: 'Atenção ao Churn',
      message: 'Taxa de churn aumentou 0.8% - considere ações de retenção',
      priority: 'medium'
    },
    {
      type: 'info',
      icon: TrendingUp,
      title: 'Oportunidade de Crescimento',
      message: 'Ticket médio pode aumentar 20% com upselling de clientes atuais',
      priority: 'low'
    }
  ];

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50 text-green-800';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'info':
        return 'border-blue-200 bg-blue-50 text-blue-800';
      default:
        return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'info':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-r from-muran-primary/5 to-muran-complementary/5">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-muran-primary/10 rounded-lg">
          <Info className="h-5 w-5 text-muran-primary" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-muran-dark">Insights Inteligentes</h3>
          <p className="text-gray-600">Análises automáticas baseadas nos seus dados</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          return (
            <div
              key={index}
              className={`p-4 rounded-lg border-2 ${getTypeStyles(insight.type)} transition-all duration-200 hover:shadow-md`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`h-5 w-5 mt-0.5 ${getIconColor(insight.type)}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-sm">{insight.title}</h4>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        insight.priority === 'high' ? 'border-red-300 text-red-700' :
                        insight.priority === 'medium' ? 'border-yellow-300 text-yellow-700' :
                        'border-blue-300 text-blue-700'
                      }`}
                    >
                      {insight.priority === 'high' ? 'Alta' : 
                       insight.priority === 'medium' ? 'Média' : 'Baixa'}
                    </Badge>
                  </div>
                  <p className="text-sm opacity-90">{insight.message}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
