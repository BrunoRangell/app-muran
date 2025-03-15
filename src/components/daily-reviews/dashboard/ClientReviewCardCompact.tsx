
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils/formatters";
import { formatDateInBrasiliaTz } from "../summary/utils";
import { ClientWithReview } from "../hooks/types/reviewTypes";
import { TrendingUp, TrendingDown, Loader, BadgeDollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClientBudgetCalculation } from "../hooks/useClientBudgetCalculation";

interface ClientReviewCardCompactProps {
  client: ClientWithReview;
  onReviewClient: (clientId: string) => void;
  isProcessing: boolean;
  compact?: boolean;
  inactive?: boolean;
}

export const ClientReviewCardCompact = ({
  client,
  onReviewClient,
  isProcessing,
  compact = false,
  inactive = false
}: ClientReviewCardCompactProps) => {
  // Informações calculadas pelo hook personalizado
  const {
    hasReview,
    isCalculating,
    calculationError,
    monthlyBudget,
    totalSpent,
    currentDailyBudget,
    idealDailyBudget,
    budgetDifference,
    customBudget,
    isUsingCustomBudgetInReview,
    needsBudgetAdjustment,
    hasDailyBudget
  } = useClientBudgetCalculation(client);

  // Debug: Mostrar informações sobre ajustes necessários
  console.log(`Cliente ${client.company_name}:`, { 
    needsBudgetAdjustment,
    hasDailyBudget,
    currentDailyBudget,
    idealDailyBudget,
    budgetDifference
  });

  // Usar needsBudgetAdjustment do hook para ter consistência com a lógica de ordenação
  const showRecommendation = hasDailyBudget && needsBudgetAdjustment;
  const needsIncrease = budgetDifference > 0;
  
  const lastReviewDate = client.lastReview?.updated_at;

  if (compact) {
    return (
      <div 
        className={cn(
          "border rounded-lg overflow-hidden",
          showRecommendation && !inactive 
            ? "border-l-4 border-l-amber-500" 
            : "border-gray-200",
          inactive && "opacity-60"
        )}
      >
        <div className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-medium text-gray-900 flex items-center gap-1">
                {client.company_name}
                {isUsingCustomBudgetInReview && (
                  <BadgeDollarSign size={16} className="text-muran-primary" />
                )}
              </h3>
              <div className="text-sm text-gray-500">
                {inactive 
                  ? "Sem conta Meta configurada" 
                  : lastReviewDate 
                    ? `Última revisão: ${formatDateInBrasiliaTz(lastReviewDate, "dd/MM 'às' HH:mm")}` 
                    : "Sem revisão recente"}
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm font-medium">
                {formatCurrency(monthlyBudget)}
              </div>
              <div className="text-sm text-gray-500">
                {hasReview ? `${formatCurrency(totalSpent)} gasto` : "Sem dados"}
              </div>
            </div>
          </div>
          
          {!inactive && (
            <div className="flex justify-between items-center mb-3">
              <div className="flex gap-2 items-center">
                <span className="text-sm text-gray-500">
                  Atual: {hasDailyBudget ? formatCurrency(currentDailyBudget) : "N/A"}
                </span>
                <span className="text-gray-300">|</span>
                <span className="text-sm text-gray-500">
                  Ideal: {idealDailyBudget > 0 ? formatCurrency(idealDailyBudget) : "N/A"}
                </span>
              </div>
            </div>
          )}
          
          {!inactive && showRecommendation && (
            <div className={cn(
              "text-sm p-2 rounded-md mb-3",
              needsIncrease ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            )}>
              <div className="flex items-center gap-1">
                {needsIncrease ? (
                  <TrendingUp size={14} />
                ) : (
                  <TrendingDown size={14} />
                )}
                <span className="font-medium">
                  {needsIncrease ? "Aumentar" : "Reduzir"} orçamento diário em {formatCurrency(Math.abs(budgetDifference))}
                </span>
              </div>
            </div>
          )}
          
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            disabled={isProcessing || inactive}
            onClick={() => onReviewClient(client.id)}
          >
            {isProcessing ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Analisando...
              </>
            ) : (
              "Analisar"
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card
      className={cn(
        "overflow-hidden",
        showRecommendation && !inactive 
          ? "border-l-4 border-l-amber-500" 
          : "border",
        inactive && "opacity-60"
      )}
    >
      <CardContent className="p-0">
        <div className="p-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-medium text-gray-900 flex items-center gap-1">
                {client.company_name}
                {isUsingCustomBudgetInReview && (
                  <BadgeDollarSign size={16} className="text-muran-primary" />
                )}
              </h3>
              <div className="text-sm text-gray-500">
                {inactive 
                  ? "Sem conta Meta configurada" 
                  : lastReviewDate 
                    ? `Última revisão: ${formatDateInBrasiliaTz(lastReviewDate, "dd/MM 'às' HH:mm")}` 
                    : "Sem revisão recente"}
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm font-medium">
                {formatCurrency(monthlyBudget)}
              </div>
              <div className="text-sm text-gray-500">
                {hasReview ? `${formatCurrency(totalSpent)} gasto` : "Sem dados"}
              </div>
            </div>
          </div>
          
          {!inactive && (
            <div className="space-y-2 mb-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-gray-50 rounded">
                  <span className="text-xs text-gray-500 block">Orçamento diário atual</span>
                  <span className="font-medium">
                    {hasDailyBudget ? formatCurrency(currentDailyBudget) : "Não disponível"}
                  </span>
                </div>
                
                <div className="p-2 bg-gray-50 rounded">
                  <span className="text-xs text-gray-500 block">Orçamento diário ideal</span>
                  <span className="font-medium">
                    {idealDailyBudget > 0 ? formatCurrency(idealDailyBudget) : "Não disponível"}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {!inactive && showRecommendation && (
            <div className={cn(
              "text-sm p-3 rounded-md mb-4",
              needsIncrease ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            )}>
              <div className="flex items-center gap-2">
                {needsIncrease ? (
                  <TrendingUp size={16} />
                ) : (
                  <TrendingDown size={16} />
                )}
                <span className="font-medium">
                  {needsIncrease ? "Aumentar" : "Reduzir"} orçamento diário em {formatCurrency(Math.abs(budgetDifference))}
                </span>
              </div>
            </div>
          )}
          
          <Button
            variant="outline"
            className="w-full"
            disabled={isProcessing || inactive}
            onClick={() => onReviewClient(client.id)}
          >
            {isProcessing ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Analisando...
              </>
            ) : (
              "Analisar"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
