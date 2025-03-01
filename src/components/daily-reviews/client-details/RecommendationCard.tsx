
import { TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RecommendationCardProps {
  recommendation: string | null;
  suggestedBudgetChange?: number | null;
}

export const RecommendationCard = ({ recommendation, suggestedBudgetChange }: RecommendationCardProps) => {
  const getRecommendationIcon = () => {
    if (!recommendation) return null;
    
    if (recommendation.includes("Aumentar")) {
      return <TrendingUp className="text-green-500" size={18} />;
    } else if (recommendation.includes("Diminuir")) {
      return <TrendingDown className="text-red-500" size={18} />;
    }
    return null;
  };

  return (
    <Card className="border-l-4 border-l-[#ff6e00]">
      <CardHeader className="pb-2">
        <CardTitle className="text-md flex items-center gap-2">
          Recomendação
          {getRecommendationIcon()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-lg font-medium">
          {recommendation || "Não há recomendação disponível"}
        </div>
        <div className="text-sm text-gray-500 mt-1">
          Baseado no orçamento mensal configurado
        </div>
      </CardContent>
    </Card>
  );
};
