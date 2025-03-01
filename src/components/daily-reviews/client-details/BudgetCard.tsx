
import { formatCurrency } from "@/utils/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface BudgetCardProps {
  latestReview: any;
  client: any;
  idealDailyBudget: number | null;
}

export const BudgetCard = ({ latestReview, client, idealDailyBudget }: BudgetCardProps) => {
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
              {latestReview && latestReview.meta_daily_budget_current !== null 
                ? formatCurrency(latestReview.meta_daily_budget_current) 
                : "N/A"}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Ideal</div>
            <div className="text-xl font-bold text-gray-600">
              {idealDailyBudget !== null ? formatCurrency(idealDailyBudget) : "N/A"}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
