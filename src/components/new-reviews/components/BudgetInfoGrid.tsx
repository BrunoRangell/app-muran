
import { formatCurrency } from "@/utils/formatters";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Calendar, TrendingUp, Clock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface BudgetInfoGridProps {
  monthlyBudget: number;
  totalSpent: number;
  currentDailyBudget: number;
  idealDailyBudget: number;
  lastFiveDaysAverage?: number;
  isCalculating: boolean;
  calculationError: Error | null;
  hasReview: boolean;
  usingCustomBudget?: boolean;
  customBudgetAmount?: number | null;
  customBudgetEndDate?: string | null;
}

export function BudgetInfoGrid({
  monthlyBudget,
  totalSpent,
  currentDailyBudget,
  idealDailyBudget,
  lastFiveDaysAverage = 0,
  isCalculating,
  calculationError,
  hasReview,
  usingCustomBudget = false,
  customBudgetAmount,
  customBudgetEndDate
}: BudgetInfoGridProps) {
  // Calcular porcentagem de gasto
  const effectiveBudget = usingCustomBudget && customBudgetAmount ? customBudgetAmount : monthlyBudget;
  
  const spentPercentage = effectiveBudget > 0 
    ? Math.round((totalSpent / effectiveBudget) * 100)
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
        Erro ao calcular orçamentos: {calculationError.message}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 mt-3">
      <div className={`rounded-lg p-3 ${usingCustomBudget ? 'bg-[#ff6e00]/10 border border-[#ff6e00]/20' : 'bg-gray-50'}`}>
        <div className="flex items-center gap-2 text-sm text-gray-600 font-medium mb-1">
          <Calendar size={16} className={usingCustomBudget ? 'text-[#ff6e00]' : ''} />
          <div className="flex items-center gap-1">
            {usingCustomBudget ? 'Orçamento Personalizado' : 'Orçamento Mensal'}
            {usingCustomBudget && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info size={14} className="text-[#ff6e00] cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-xs">
                      Este cliente está utilizando um orçamento personalizado
                      {customBudgetEndDate && ` válido até ${new Date(customBudgetEndDate).toLocaleDateString('pt-BR')}`}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
        <div className={`text-lg font-semibold ${usingCustomBudget ? 'text-[#ff6e00]' : ''}`}>
          {formatCurrency(effectiveBudget)}
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
          <TrendingUp size={16} />
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
}
