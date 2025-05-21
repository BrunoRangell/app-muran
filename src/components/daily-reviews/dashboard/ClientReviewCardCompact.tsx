
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ClientWithReview } from "../hooks/types/reviewTypes";
import { useClientBudgetCalculation } from "../hooks/useClientBudgetCalculation";
import { Link } from "react-router-dom";
import { AlertTriangle, BadgeDollarSign } from "lucide-react";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { CardHeader } from "./CardHeader";
import { BudgetDisplay } from "./card-components/BudgetDisplay";
import { BudgetRecommendation } from "./card-components/BudgetRecommendation";
import { CustomBudgetButton } from "./card-components/CustomBudgetButton";
import { ReviewButton } from "./card-components/ReviewButton";
import { ClientStatusBadge } from "./card-components/ClientStatusBadge";
import { ClientInfo } from "./card-components/ClientInfo";
import { CompactBudgetInfo } from "./card-components/CompactBudgetInfo";
import { CompactBudgetRecommendation } from "./card-components/CompactBudgetRecommendation";
import { CompactActionButtons } from "./card-components/CompactActionButtons";
import { formatDateInBrasiliaTz } from "../summary/utils";

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
  const {
    hasReview,
    calculationError,
    monthlyBudget,
    totalSpent,
    currentDailyBudget,
    lastFiveDaysAverage,
    idealDailyBudget,
    budgetDifference,
    budgetDifferenceBasedOnAverage,
    customBudget,
    isUsingCustomBudgetInReview,
    actualBudgetAmount,
    remainingDaysValue,
    needsBudgetAdjustment,
    needsAdjustmentBasedOnAverage
  } = useClientBudgetCalculation(client);

  // Flag para mostrar recomendação de orçamento
  const showRecommendation = hasReview && needsBudgetAdjustment;
  const showRecommendationAverage = hasReview && needsAdjustmentBasedOnAverage && lastFiveDaysAverage > 0;
  const needsIncrease = budgetDifference > 0;
  const needsIncreaseAverage = budgetDifferenceBasedOnAverage > 0;
  const lastReviewDate = client.lastReview?.updated_at;
  
  // Verificar se tem orçamento personalizado
  const hasCustomBudget = customBudget || isUsingCustomBudgetInReview;

  // Valor do orçamento a exibir (personalizado ou padrão)
  const displayBudget = hasCustomBudget ? actualBudgetAmount : monthlyBudget;

  // Determinar classes de estilo com base no status
  const cardClasses = `overflow-hidden transition-all ${
    inactive ? 'opacity-60 hover:opacity-80' : ''
  } ${
    hasReview && !inactive && (showRecommendation || showRecommendationAverage)
      ? 'border-l-4 border-l-amber-500' 
      : compact ? 'border' : 'border shadow-sm hover:shadow'
  }`;

  // Grid Compacto (Tabela)
  if (compact) {
    return (
      <Card className={`${cardClasses} flex items-center`}>
        <ClientInfo 
          companyName={client.company_name} 
          lastReviewDate={lastReviewDate} 
        />
        
        <CompactBudgetInfo 
          displayBudget={displayBudget}
          currentDailyBudget={currentDailyBudget}
          idealDailyBudget={idealDailyBudget}
          hasReview={hasReview}
          hasCustomBudget={hasCustomBudget}
        />
        
        <CompactBudgetRecommendation 
          hasReview={hasReview}
          inactive={inactive}
          showRecommendation={showRecommendation}
          showRecommendationAverage={showRecommendationAverage}
          needsIncrease={needsIncrease}
          needsIncreaseAverage={needsIncreaseAverage}
          budgetDifference={budgetDifference}
          budgetDifferenceBasedOnAverage={budgetDifferenceBasedOnAverage}
          lastFiveDaysAverage={lastFiveDaysAverage}
        />
        
        <CompactActionButtons 
          clientId={client.id}
          hasCustomBudget={hasCustomBudget}
          onReviewClient={() => onReviewClient(client.id)}
          isProcessing={isProcessing}
          inactive={inactive}
        />
      </Card>
    );
  }
  
  // Grid de Cartões
  return (
    <Card className={cardClasses}>
      <CardContent className="p-4 pt-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-muran-dark flex items-center gap-1">
              {client.company_name}
              {hasCustomBudget && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <BadgeDollarSign size={16} className="text-[#ff6e00]" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Orçamento personalizado</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </h3>
            <p className="text-xs text-gray-500">
              {lastReviewDate ? formatDateInBrasiliaTz(new Date(lastReviewDate), "dd/MM 'às' HH:mm") : "Sem revisão"}
            </p>
          </div>
          
          <ClientStatusBadge
            inactive={inactive}
            calculationError={calculationError}
          />
        </div>
        
        <BudgetDisplay
          displayBudget={displayBudget}
          totalSpent={totalSpent}
          currentDailyBudget={currentDailyBudget}
          lastFiveDaysAverage={lastFiveDaysAverage}
          hasReview={hasReview}
          hasCustomBudget={hasCustomBudget}
        />
        
        {hasReview && !inactive && (showRecommendation || showRecommendationAverage) && (
          <BudgetRecommendation
            showRecommendation={showRecommendation}
            showRecommendationAverage={showRecommendationAverage}
            needsIncrease={needsIncrease}
            needsIncreaseAverage={needsIncreaseAverage}
            budgetDifference={budgetDifference}
            budgetDifferenceBasedOnAverage={budgetDifferenceBasedOnAverage}
            lastFiveDaysAverage={lastFiveDaysAverage}
          />
        )}
        
        {hasReview && !inactive && !showRecommendation && !showRecommendationAverage && (
          <BudgetRecommendation
            showRecommendation={false}
            showRecommendationAverage={false}
            needsIncrease={false}
            needsIncreaseAverage={false}
            budgetDifference={0}
            budgetDifferenceBasedOnAverage={0}
            lastFiveDaysAverage={0}
          />
        )}
        
        <CustomBudgetButton hasCustomBudget={hasCustomBudget} />
      </CardContent>
      
      <CardFooter className="p-3 pt-0 border-t bg-gray-50/50">
        <ReviewButton
          onReviewClient={() => onReviewClient(client.id)}
          isProcessing={isProcessing}
          inactive={inactive}
        />
      </CardFooter>
    </Card>
  );
};
