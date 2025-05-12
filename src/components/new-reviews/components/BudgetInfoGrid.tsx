
import { Card, CardContent } from "@/components/ui/card";
import { BudgetInfo } from "../types/budgetTypes";

interface BudgetInfoGridProps {
  budgetInfo: BudgetInfo;
  usingCustomBudget?: boolean;
}

export function BudgetInfoGrid({ budgetInfo, usingCustomBudget = false }: BudgetInfoGridProps) {
  const {
    monthlyBudget,
    totalSpent,
    currentDailyBudget,
    idealDailyBudget,
    remainingBudget,
    remainingDays,
    spentPercentage,
  } = budgetInfo;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-gray-500">Orçamento {usingCustomBudget ? 'Personalizado' : 'Mensal'}</p>
          <p className="text-lg font-semibold">R$ {monthlyBudget.toFixed(2)}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-gray-500">Total Gasto</p>
          <p className="text-lg font-semibold">R$ {totalSpent.toFixed(2)}</p>
          <p className="text-xs text-gray-500">{spentPercentage.toFixed(1)}% do orçamento</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-gray-500">Orçamento Restante</p>
          <p className="text-lg font-semibold">R$ {remainingBudget.toFixed(2)}</p>
          <p className="text-xs text-gray-500">{remainingDays} dias restantes</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-gray-500">Orçamento Diário Atual</p>
          <p className="text-lg font-semibold">R$ {currentDailyBudget.toFixed(2)}/dia</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-gray-500">Orçamento Diário Ideal</p>
          <p className="text-lg font-semibold">R$ {idealDailyBudget.toFixed(2)}/dia</p>
        </CardContent>
      </Card>
    </div>
  );
}
