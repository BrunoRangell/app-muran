
import { ArrowTrendingUp, ArrowTrendingDown, Minus } from "lucide-react";
import { calculateIdealDailyBudget } from "@/components/daily-reviews/summary/utils";

interface BudgetRecommendationProps {
  client: any;
  platform?: 'meta' | 'google';
}

export const BudgetRecommendation = ({ client, platform = 'meta' }: BudgetRecommendationProps) => {
  // Campos relacionados à plataforma
  const budgetField = platform === 'meta' ? 'meta_ads_budget' : 'google_ads_budget';
  const dailyBudgetField = platform === 'meta' ? 'meta_daily_budget_current' : 'google_daily_budget_current';
  
  // Calcular orçamento diário ideal
  const monthlyBudget = client[budgetField] || 0;
  const currentDailyBudget = client.latestReview?.[dailyBudgetField] || 0;
  const idealDailyBudget = calculateIdealDailyBudget(monthlyBudget, new Date());
  
  // Determinar a ação recomendada
  let recommendation = "";
  let icon = <Minus />;
  let colorClass = "bg-gray-100 text-gray-700";
  
  if (currentDailyBudget === 0) {
    recommendation = "Configure o orçamento diário";
    colorClass = "bg-yellow-100 text-yellow-800";
  } else if (idealDailyBudget > currentDailyBudget * 1.1) {
    recommendation = "Aumentar orçamento diário";
    icon = <ArrowTrendingUp className="text-emerald-600" />;
    colorClass = "bg-emerald-100 text-emerald-800";
  } else if (idealDailyBudget < currentDailyBudget * 0.9) {
    recommendation = "Diminuir orçamento diário";
    icon = <ArrowTrendingDown className="text-amber-600" />;
    colorClass = "bg-amber-100 text-amber-800";
  } else {
    recommendation = "Manter orçamento diário";
    colorClass = "bg-blue-100 text-blue-800";
  }
  
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-md ${colorClass}`}>
      <span className="p-1 rounded-full bg-white/50">{icon}</span>
      <span className="text-sm font-medium">{recommendation}</span>
    </div>
  );
};
