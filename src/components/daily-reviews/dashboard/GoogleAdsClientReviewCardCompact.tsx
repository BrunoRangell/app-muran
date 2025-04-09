
import React from "react";
import { formatCurrency } from "@/utils/formatters";
import { ClientWithReview } from "../hooks/types/reviewTypes";
import { useGoogleAdsBudgetCalculation } from "../hooks/useGoogleAdsBudgetCalculation";
import { Button } from "@/components/ui/button";
import { EyeIcon, BarChart4, RotateCw } from "lucide-react";
import { BudgetInfoGrid } from "./BudgetInfoGrid";
import { CardActions } from "./CardActions";
import { CardHeader } from "./CardHeader";
import { BudgetRecommendation } from "./BudgetRecommendation";
import { CalculationError } from "./CalculationError";

interface GoogleAdsClientReviewCardCompactProps {
  client: ClientWithReview;
  onViewDetails: (clientId: string) => void;
  onAnalyze: (clientId: string) => void;
  isAnalyzing?: boolean;
}

export const GoogleAdsClientReviewCardCompact: React.FC<GoogleAdsClientReviewCardCompactProps> = ({
  client,
  onViewDetails,
  onAnalyze,
  isAnalyzing = false,
}) => {
  const {
    hasReview,
    isCalculating,
    calculationError,
    totalSpent,
    currentDailyBudget,
    idealDailyBudget,
    needsBudgetAdjustment,
  } = useGoogleAdsBudgetCalculation(client);

  const lastFiveDaysSpent = client.lastReview?.google_last_five_days_spent || 0;

  return (
    <div
      className={`border rounded-xl overflow-hidden ${
        needsBudgetAdjustment ? "border-amber-300" : "border-gray-200"
      } transition shadow hover:shadow-md`}
    >
      <CardHeader
        clientName={client.company_name}
        accountId={client.google_account_id}
        platformName="Google Ads"
        needsAdjustment={needsBudgetAdjustment}
      />

      <div className="p-4 pt-0">
        {calculationError ? (
          <CalculationError error={calculationError} />
        ) : (
          <>
            <BudgetInfoGrid
              title="Gastos Gerais"
              value1={{
                label: "Total Gasto",
                value: formatCurrency(totalSpent || 0),
                icon: <BarChart4 className="h-3.5 w-3.5 text-gray-500" />,
              }}
              value2={{
                label: "Últ. 5 dias",
                value: formatCurrency(lastFiveDaysSpent),
                icon: <BarChart4 className="h-3.5 w-3.5 text-gray-500" />,
              }}
            />

            <BudgetInfoGrid
              title="Orçamento Diário"
              value1={{
                label: "Atual",
                value: formatCurrency(currentDailyBudget || 0),
              }}
              value2={{
                label: "Recomendado",
                value: formatCurrency(idealDailyBudget || 0),
              }}
            />

            {needsBudgetAdjustment && (
              <BudgetRecommendation
                currentBudget={currentDailyBudget || 0}
                recommendedBudget={idealDailyBudget || 0}
              />
            )}
          </>
        )}

        <CardActions>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(client.id)}
            className="flex-1 text-xs"
          >
            <EyeIcon className="h-3.5 w-3.5 mr-1" />
            Detalhes
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onAnalyze(client.id)}
            disabled={isAnalyzing}
            className="flex-1 text-xs"
          >
            <RotateCw
              className={`h-3.5 w-3.5 mr-1 ${isAnalyzing ? "animate-spin" : ""}`}
            />
            Analisar
          </Button>
        </CardActions>
      </div>
    </div>
  );
};
