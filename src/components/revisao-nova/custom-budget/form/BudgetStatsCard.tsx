
import { Card } from "@/components/ui/card";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCurrency } from "@/utils/formatters";

interface BudgetStatsCardProps {
  daysInPeriod: number;
  dailyBudget: number;
}

export function BudgetStatsCard({ daysInPeriod, dailyBudget }: BudgetStatsCardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-md">
      <div className="flex items-center">
        <span className="text-sm text-gray-500 mr-2">Duração do período:</span>
        <p className="font-medium">{daysInPeriod} dias</p>
      </div>
      <div className="flex items-center">
        <span className="text-sm text-gray-500 mr-2">Orçamento diário:</span>
        <p className="font-medium">{formatCurrency(dailyBudget)}</p>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 p-0 ml-1">
                <Info className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="w-72">
              <p className="text-xs">
                Este é o valor médio diário. A estimativa considera 
                o período total incluindo início e término.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
