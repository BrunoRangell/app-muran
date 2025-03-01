
import { formatCurrency } from "@/utils/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface BudgetCardProps {
  latestReview: any;
  client: any;
  idealDailyBudget: number | null;
}

export const BudgetCard = ({ latestReview, client, idealDailyBudget }: BudgetCardProps) => {
  // Função para garantir que os valores sejam tratados como números
  const getNumericValue = (value: any): number => {
    if (value === null || value === undefined) return 0;
    const numValue = Number(value);
    return isNaN(numValue) ? 0 : numValue;
  };

  const currentDailyBudget = getNumericValue(latestReview?.meta_daily_budget_current);
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-md">Orçamento Diário</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">Atual</div>
            <div className="text-xl font-bold">
              {formatCurrency(currentDailyBudget)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Ideal</div>
            <div className="text-xl font-bold text-[#ff6e00]">
              {idealDailyBudget !== null ? formatCurrency(idealDailyBudget) : "N/A"}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
