
import { formatCurrency } from "@/utils/formatters";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Calendar, ArrowTrendingUp, Clock } from "lucide-react";

interface BudgetInfoGridProps {
  monthlyBudget: number;
  totalSpent: number;
  currentDailyBudget: number;
  idealDailyBudget: number;
  lastFiveDaysAverage?: number;
  isCalculating: boolean;
  calculationError: Error | null;
  hasReview: boolean;
}

export const BudgetInfoGrid = ({
  monthlyBudget,
  totalSpent,
  currentDailyBudget,
  idealDailyBudget,
  lastFiveDaysAverage = 0,
  isCalculating,
  calculationError,
  hasReview
}: BudgetInfoGridProps) => {
  // Calcular porcentagem de gasto
  const spentPercentage = monthlyBudget > 0 
    ? Math.round((totalSpent / monthlyBudget) * 100)
    : 0;

  if (isCalculating) {
    return (
      <div className="grid grid-cols-2 gap-3 mt-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  if (calculationError) {
    return (
      <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-lg">
        Erro ao calcular orçamentos
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 mt-3">
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex items-center gap-2 text-sm text-gray-600 font-medium mb-1">
          <Calendar size={16} />
          Orçamento Mensal
        </div>
        <div className="text-lg font-semibold">
          {formatCurrency(monthlyBudget)}
        </div>
        <div className="text-xs mt-1 text-gray-500">
          Gasto: {formatCurrency(totalSpent)} ({spentPercentage}%)
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex items-center gap-2 text-sm text-gray-600 font-medium mb-1">
          <DollarSign size={16} />
          Orçamento Diário Atual
        </div>
        <div className="text-lg font-semibold">
          {hasReview ? formatCurrency(currentDailyBudget) : 'Não configurado'}
        </div>
        {hasReview && (
          <div className="text-xs mt-1 text-gray-500">
            Campanhas ativas
          </div>
        )}
      </div>
      
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex items-center gap-2 text-sm text-gray-600 font-medium mb-1">
          <ArrowTrendingUp size={16} />
          Orçamento Diário Ideal
        </div>
        <div className="text-lg font-semibold">
          {formatCurrency(idealDailyBudget)}
        </div>
        <div className="text-xs mt-1 text-gray-500">
          Baseado no orçamento restante
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex items-center gap-2 text-sm text-gray-600 font-medium mb-1">
          <Clock size={16} />
          Média últimos 5 dias
        </div>
        <div className="text-lg font-semibold">
          {hasReview && lastFiveDaysAverage > 0 ? formatCurrency(lastFiveDaysAverage) : 'Não disponível'}
        </div>
        <div className="text-xs mt-1 text-gray-500">
          Gasto médio diário real
        </div>
      </div>
    </div>
  );
};
