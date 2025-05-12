
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/utils/formatters";
import { 
  BarChart, 
  DollarSign, 
  TrendingDown, 
  TrendingUp, 
  Calendar,
  MinusCircle,
  Info
} from "lucide-react";
import { ReviewHistoryTable } from "./ReviewHistoryTable";
import { formatDateInBrasiliaTz } from "../summary/utils";
import { Tooltip } from "@/components/ui/tooltip";
import {
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ClientDetailsContentProps {
  client: any;
  latestReview: any;
  reviewHistory: any[] | null;
  recommendation: string | null;
  recommendationAverage: string | null;
  idealDailyBudget: number;
  suggestedBudgetChange: number;
  suggestedBudgetChangeAverage: number;
  lastFiveDaysAverage: number;
  isLoadingHistory: boolean;
  onRefresh: () => void;
  // Parâmetros para mostrar detalhes do cálculo
  remainingDays?: number;
  remainingBudget?: number;
  monthlyBudget?: number;
  totalSpent?: number;
}

export const ClientDetailsContent = ({
  client,
  latestReview,
  reviewHistory,
  recommendation,
  recommendationAverage,
  idealDailyBudget,
  suggestedBudgetChange,
  suggestedBudgetChangeAverage,
  lastFiveDaysAverage,
  isLoadingHistory,
  onRefresh,
  remainingDays,
  remainingBudget,
  monthlyBudget,
  totalSpent
}: ClientDetailsContentProps) => {
  const getLastReviewDate = () => {
    if (!latestReview || !latestReview.review_date) return "Sem revisão recente";
    
    return formatDateInBrasiliaTz(
      latestReview.review_date,
      "dd 'de' MMMM 'às' HH:mm"
    );
  };

  const getRecommendationIcon = (rec: string | null) => {
    if (!rec) return <MinusCircle className="text-gray-500" size={18} />;
    
    if (rec.includes("Aumentar")) {
      return <TrendingUp className="text-green-500" size={18} />;
    } else if (rec.includes("Diminuir")) {
      return <TrendingDown className="text-red-500" size={18} />;
    } else {
      return <MinusCircle className="text-gray-500" size={18} />;
    }
  };

  const getRecommendationColorClass = (rec: string | null) => {
    if (!rec) return "text-gray-600";
    
    if (rec.includes("Aumentar")) {
      return "text-green-600";
    } else if (rec.includes("Diminuir")) {
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
              <div className={`flex items-center gap-1 ${getRecommendationColorClass(recommendation)} font-medium`}>
                {getRecommendationIcon(recommendation)}
                {recommendation || "Nenhum ajuste necessário"}
                {recommendation && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info size={14} className="text-gray-500 cursor-help ml-1" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Recomendação baseada no orçamento diário atual configurado nas campanhas.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              
              {lastFiveDaysAverage > 0 && recommendationAverage && (
                <div className={`flex items-center gap-1 mt-2 ${getRecommendationColorClass(recommendationAverage)} font-medium`}>
                  {getRecommendationIcon(recommendationAverage)}
                  {recommendationAverage || "Nenhum ajuste necessário"}
                  {recommendationAverage && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info size={14} className="text-gray-500 cursor-help ml-1" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Recomendação baseada na média de gasto dos últimos 5 dias: {formatCurrency(lastFiveDaysAverage)}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              )}
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
              <div className="text-sm font-medium mb-1">Orç. diário atual:</div>
              <div className="text-xl font-semibold">
                {latestReview?.google_daily_budget_current 
                  ? formatCurrency(latestReview.google_daily_budget_current)
                  : "Não configurado"}
              </div>
            </div>

            {lastFiveDaysAverage > 0 && (
              <div className="mt-3">
                <div className="text-sm font-medium mb-1">Média últimos 5 dias:</div>
                <div className="text-xl font-semibold">
                  {formatCurrency(lastFiveDaysAverage)}
                </div>
              </div>
            )}

            {totalSpent !== undefined && (
              <div className="mt-3">
                <div className="text-sm font-medium mb-1">Total Gasto no Mês:</div>
                <div className="text-xl font-semibold">
                  {formatCurrency(totalSpent)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="text-muran-primary" size={18} />
              Recomendação de Orçamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <div className="text-sm font-medium mb-1">Orçamento diário ideal:</div>
              <div className="text-xl font-semibold">
                {formatCurrency(idealDailyBudget)}
              </div>
            </div>
            
            <div className="mt-3">
              <div className="text-sm font-medium mb-1">Dias restantes:</div>
              <div className="text-xl font-semibold">
                {remainingDays || "-"}
              </div>
            </div>
            
            <div className="mt-3">
              <div className="text-sm font-medium mb-1">Orçamento restante:</div>
              <div className="text-xl font-semibold">
                {remainingBudget !== undefined ? formatCurrency(remainingBudget) : "-"}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {reviewHistory && reviewHistory.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Histórico de Revisões</CardTitle>
          </CardHeader>
          <CardContent>
            <ReviewHistoryTable 
              reviewHistory={reviewHistory} 
              isLoading={isLoadingHistory} 
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};
