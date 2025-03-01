
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";

interface SummaryCardsProps {
  totalMonthlyBudget: number;
  totalSpent: number;
  increases: number;
  decreases: number;
  maintains: number;
  reviewsCount: number;
}

export const SummaryCards = ({
  totalMonthlyBudget,
  totalSpent,
  increases,
  decreases,
  maintains,
  reviewsCount
}: SummaryCardsProps) => {
  const spentPercentage = totalMonthlyBudget > 0 
    ? Math.min((totalSpent / totalMonthlyBudget) * 100, 100)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Meta Ads</CardTitle>
          <CardDescription>Orçamento e gasto</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
          <p className="text-sm text-gray-500">
            de {formatCurrency(totalMonthlyBudget)} disponível
          </p>
          <div className="mt-2 text-sm flex items-center gap-1">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${spentPercentage}%` }}
              ></div>
            </div>
            <span>
              {Math.round(spentPercentage)}%
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="text-green-500" size={18} />
            Aumentar orçamento
          </CardTitle>
          <CardDescription>Recomendações de aumento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="text-2xl font-bold">{increases}</div>
            <div className="text-sm text-gray-500">
              clientes precisam de orçamento maior
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="text-red-500" size={18} />
            Diminuir orçamento
          </CardTitle>
          <CardDescription>Recomendações de redução</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="text-2xl font-bold">{decreases}</div>
            <div className="text-sm text-gray-500">
              clientes com orçamento elevado
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Analisados</CardTitle>
          <CardDescription>Clientes revisados hoje</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{reviewsCount}</div>
          <p className="text-sm text-gray-500">
            {maintains} com orçamento adequado
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
