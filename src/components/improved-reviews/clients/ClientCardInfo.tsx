
import { formatCurrency, formatPercentage } from "@/utils/formatters";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface ClientCardInfoProps {
  platform: "google" | "meta";
  dailyBudget: number;
  idealBudget: number;
  totalSpent: number;
  needsAdjustment: boolean;
  totalBudget: number;
  lastFiveDaysAvg?: number;
  className?: string;
  accountName?: string;
}

export const ClientCardInfo = ({
  platform,
  dailyBudget,
  idealBudget,
  totalSpent,
  needsAdjustment,
  totalBudget,
  lastFiveDaysAvg,
  className = "",
  accountName
}: ClientCardInfoProps) => {
  // Calcular a porcentagem gasta do orçamento
  const spentPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  
  // Calcular a diferença entre orçamento ideal e atual
  const budgetDifference = idealBudget - dailyBudget;
  const absoluteDifference = Math.abs(budgetDifference);
  
  // Determinar direção do ajuste
  const adjustmentDirection = budgetDifference > 0 ? "up" : "down";
  
  // Formatar valores para exibição
  const formattedDailyBudget = formatCurrency(dailyBudget);
  const formattedIdealBudget = formatCurrency(idealBudget);
  const formattedTotalSpent = formatCurrency(totalSpent);
  const formattedTotalBudget = formatCurrency(totalBudget);
  const formattedLastFiveDaysAvg = lastFiveDaysAvg ? formatCurrency(lastFiveDaysAvg) : "N/A";

  return (
    <div className={`grid grid-cols-2 gap-2 text-sm ${className}`}>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Orçamento Mensal:</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-0.5">
                  <span className="font-medium">{formattedTotalBudget}</span>
                  <Info className="h-3.5 w-3.5 text-gray-400" />
                </span>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="text-xs">Valor total do orçamento mensal configurado</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Gasto do Mês:</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-0.5">
                  <span className="font-medium">{formattedTotalSpent}</span>
                  <span className="text-xs text-gray-500">({formatPercentage(spentPercentage/100)})</span>
                  <Info className="h-3.5 w-3.5 text-gray-400" />
                </span>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="text-xs">Total gasto no mês atual até o momento</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {lastFiveDaysAvg !== undefined && (
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Média 5 dias:</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-0.5">
                    <span className="font-medium">{formattedLastFiveDaysAvg}</span>
                    <Info className="h-3.5 w-3.5 text-gray-400" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p className="text-xs">Média de gasto diário dos últimos 5 dias</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
        
        {accountName && platform === 'meta' && (
          <div className="flex items-center gap-2">
            <span className="text-gray-500">CA:</span>
            <span className="font-medium">{accountName}</span>
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Orç. diário atual:</span>
          <span className="font-medium">{formattedDailyBudget}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Orç. diário ideal:</span>
          <span className="font-medium">{formattedIdealBudget}</span>
        </div>
        
        {needsAdjustment && (
          <div>
            <Badge className={adjustmentDirection === "up" ? "bg-amber-100 text-amber-800 hover:bg-amber-200" : "bg-blue-100 text-blue-800 hover:bg-blue-200"}>
              {adjustmentDirection === "up" 
                ? `Aumentar ${formatCurrency(absoluteDifference)}`
                : `Reduzir ${formatCurrency(absoluteDifference)}`}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
};
