
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/utils/formatters";
import { 
  BarChart, 
  DollarSign, 
  TrendingDown, 
  TrendingUp, 
  Calendar,
  MinusCircle
} from "lucide-react";
import { ReviewHistoryTable } from "./ReviewHistoryTable";
import { formatDateInBrasiliaTz } from "../summary/utils";

interface ClientDetailsContentProps {
  client: any;
  latestReview: any;
  reviewHistory: any[] | null;
  recommendation: string | null;
  idealDailyBudget: number;
  suggestedBudgetChange: number;
  isLoadingHistory: boolean;
  onRefresh: () => void;
}

export const ClientDetailsContent = ({
  client,
  latestReview,
  reviewHistory,
  recommendation,
  idealDailyBudget,
  suggestedBudgetChange,
  isLoadingHistory,
  onRefresh
}: ClientDetailsContentProps) => {
  const getLastReviewDate = () => {
    if (!latestReview || !latestReview.review_date) return "Sem revisão recente";
    
    return `Última revisão em ${formatDateInBrasiliaTz(
      latestReview.review_date,
      "dd 'de' MMMM 'às' HH:mm"
    )}`;
  };

  const getRecommendationIcon = () => {
    if (!recommendation) return null;
    
    if (recommendation.includes("Aumentar")) {
      return <TrendingUp className="text-green-500" size={18} />;
    } else if (recommendation.includes("Diminuir")) {
      return <TrendingDown className="text-red-500" size={18} />;
    } else {
      return <MinusCircle className="text-gray-500" size={18} />;
    }
  };

  const getRecommendationColorClass = () => {
    if (!recommendation) return "";
    
    if (recommendation.includes("Aumentar")) {
      return "text-green-600";
    } else if (recommendation.includes("Diminuir")) {
      return "text-red-600";
    }
    return "text-gray-600";
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="text-muran-primary" size={18} />
              Status da Revisão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500 mb-2">
              {getLastReviewDate()}
            </div>
            
            <div className="mt-3">
              <div className="text-sm font-medium mb-1">Recomendação:</div>
              <div className={`flex items-center gap-1 ${getRecommendationColorClass()} font-medium`}>
                {getRecommendationIcon()}
                {recommendation || "Sem recomendação disponível"}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart className="text-muran-primary" size={18} />
              Orçamento Meta Ads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <div className="text-sm font-medium mb-1">Orçamento Mensal:</div>
              <div className="text-xl font-semibold">
                {formatCurrency(client.meta_ads_budget || 0)}
              </div>
            </div>
            
            <div className="mt-3">
              <div className="text-sm font-medium mb-1">Orçamento Diário Atual:</div>
              <div className="text-xl font-semibold">
                {latestReview?.meta_daily_budget_current 
                  ? formatCurrency(latestReview.meta_daily_budget_current)
                  : "Não configurado"}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="text-muran-primary" size={18} />
              Orçamento Sugerido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <div className="text-sm font-medium mb-1">Orçamento Diário Ideal:</div>
              <div className="text-xl font-semibold">
                {formatCurrency(idealDailyBudget)}
              </div>
            </div>
            
            {suggestedBudgetChange !== 0 && (
              <div className="mt-3">
                <div className="text-sm font-medium mb-1">Ajuste Sugerido:</div>
                <div className={`flex items-center gap-1 text-lg font-semibold ${suggestedBudgetChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {suggestedBudgetChange > 0 ? (
                    <TrendingUp size={16} />
                  ) : (
                    <TrendingDown size={16} />
                  )}
                  {suggestedBudgetChange > 0 ? '+' : ''}
                  {formatCurrency(suggestedBudgetChange)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ReviewHistoryTable 
        isLoading={isLoadingHistory} 
        reviewHistory={reviewHistory} 
      />
    </div>
  );
};
