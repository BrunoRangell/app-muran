
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/utils/formatters";
import { AlertCircle, Calendar } from "lucide-react";
import { MetaDateRange } from "../hooks/types";

interface BudgetCardProps {
  monthlyBudget: number;
  dailyBudget: number;
  idealDailyBudget: number;
  dateRange: MetaDateRange | null;
}

export const BudgetCard = ({
  monthlyBudget,
  dailyBudget,
  idealDailyBudget,
  dateRange
}: BudgetCardProps) => {
  // Verificar se temos valores válidos para mostrar o alerta
  const shouldShowAlert = !isNaN(idealDailyBudget) && idealDailyBudget > 0 && 
                         !isNaN(dailyBudget) && dailyBudget > 0 &&
                         Math.abs(dailyBudget - idealDailyBudget) > 5;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muran-primary" />
          Orçamento
        </CardTitle>
        <CardDescription>
          Orçamentos atuais configurados para as campanhas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">Orçamento Mensal</div>
            <div className="text-2xl font-bold">{formatCurrency(monthlyBudget)}</div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">Orçamento Diário Atual</div>
            <div className="text-2xl font-bold text-[#ff6e00]">{formatCurrency(dailyBudget)}</div>
          </div>
        </div>

        {idealDailyBudget > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-blue-700 mb-1">Orçamento Diário Ideal</div>
            <div className="text-xl font-bold text-blue-700">{formatCurrency(idealDailyBudget)}</div>
          </div>
        )}

        {shouldShowAlert && (
          <div className="bg-amber-50 p-4 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-amber-800">
                Orçamento diário atual difere do ideal em {formatCurrency(Math.abs(dailyBudget - idealDailyBudget))}
              </div>
              <div className="text-xs text-amber-700 mt-1">
                Considere ajustar o orçamento diário para otimizar seus resultados
              </div>
            </div>
          </div>
        )}
        
        {dateRange && (
          <div className="text-xs text-gray-500 mt-2">
            Dados analisados no período: {dateRange.start} até {dateRange.end}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
