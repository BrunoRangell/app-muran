
import { TrendingDown, TrendingUp, MinusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/utils/formatters";

interface RecommendationCardProps {
  recommendation: string | null;
  suggestedBudgetChange?: number | null;
  currentBudget?: number | null;
}

export const RecommendationCard = ({ recommendation, suggestedBudgetChange, currentBudget }: RecommendationCardProps) => {
  const getRecommendationIcon = () => {
    if (!recommendation) return null;
    
    if (recommendation.includes("Aumentar")) {
      return <TrendingUp className="text-green-500" size={18} />;
    } else if (recommendation.includes("Diminuir")) {
      return <TrendingDown className="text-red-500" size={18} />;
    } else if (recommendation.includes("Manter")) {
      return <MinusCircle className="text-gray-500" size={18} />;
    }
    return null;
  };

  const getRecommendationColorClass = () => {
    if (!recommendation) return "";
    
    if (recommendation.includes("Aumentar")) {
      return "text-green-600";
    } else if (recommendation.includes("Diminuir")) {
      return "text-red-600";
    }
    return "";
  };

  // Formatação da mensagem de ajuste recomendado
  const getAdjustmentMessage = () => {
    if (!suggestedBudgetChange) return null;
    
    if (suggestedBudgetChange > 5) {
      return {
        text: `Ajuste recomendado: Reduzir ${formatCurrency(Math.abs(suggestedBudgetChange))}`,
        color: "text-red-600",
        bgColor: "bg-red-50"
      };
    } else if (suggestedBudgetChange < -5) {
      return {
        text: `Ajuste recomendado: Aumentar ${formatCurrency(Math.abs(suggestedBudgetChange))}`,
        color: "text-green-600",
        bgColor: "bg-green-50"
      };
    }
    return null;
  };

  const adjustmentInfo = getAdjustmentMessage();

  return (
    <Card className="border-l-4 border-l-[#ff6e00]">
      <CardHeader className="pb-2">
        <CardTitle className="text-md flex items-center gap-2">
          Recomendação
          {getRecommendationIcon()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-lg font-medium ${getRecommendationColorClass()}`}>
          {recommendation || "Não há recomendação disponível"}
        </div>
        {adjustmentInfo && (
          <div className={`text-sm mt-2 p-2 rounded-md ${adjustmentInfo.bgColor}`}>
            <div className={`font-medium ${adjustmentInfo.color}`}>
              {adjustmentInfo.text}
            </div>
          </div>
        )}
        <div className="text-sm text-gray-500 mt-1">
          Baseado no orçamento mensal configurado
        </div>
      </CardContent>
    </Card>
  );
};
