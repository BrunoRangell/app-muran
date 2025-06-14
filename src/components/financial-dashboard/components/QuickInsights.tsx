import { Card } from "@/components/ui/card";
import { TrendingUp, AlertCircle, CheckCircle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CostFilters } from "@/types/cost";
interface QuickInsightsProps {
  filters: CostFilters;
}
export const QuickInsights = ({
  filters
}: QuickInsightsProps) => {
  const insights = [{
    type: 'success',
    icon: CheckCircle,
    title: 'Crescimento Saudável',
    message: 'MRR cresceu 15.7% no último mês, superando a meta de 10%',
    priority: 'high'
  }, {
    type: 'warning',
    icon: AlertCircle,
    title: 'Atenção ao Churn',
    message: 'Taxa de churn aumentou 0.8% - considere ações de retenção',
    priority: 'medium'
  }, {
    type: 'info',
    icon: TrendingUp,
    title: 'Oportunidade de Crescimento',
    message: 'Ticket médio pode aumentar 20% com upselling de clientes atuais',
    priority: 'low'
  }];
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
  return;
};