
import { formatCurrency } from "@/utils/formatters";
import { ClientCardInfo } from "../ClientCardInfo";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, BadgeDollarSign } from "lucide-react";

interface ExpandedDetailsProps {
  platform: "meta" | "google";
  client: any;
  isUsingCustomBudget: boolean;
  customBudget: any;
  originalBudgetAmount: number;
  budgetAmount: number;
  lastFiveDaysAvg?: number;
}

export function ExpandedDetails({ 
  platform, 
  client, 
  isUsingCustomBudget, 
  customBudget, 
  originalBudgetAmount, 
  budgetAmount,
  lastFiveDaysAvg
}: ExpandedDetailsProps) {
  const dailyBudget = client.review?.[`${platform}_daily_budget_current`] || 0;
  const totalSpent = client.review?.[`${platform}_total_spent`] || 0;
  const idealBudget = client.budgetCalculation?.idealDailyBudget || 0;
  const needsAdjustment = client.budgetCalculation?.needsBudgetAdjustment || false;
  
  // Ajuste para não mostrar média dos últimos 5 dias para Meta
  const showLastFiveDaysAvg = platform === "google" && lastFiveDaysAvg !== undefined;
  
  return (
    <div className="space-y-3">
      <Separator />
      
      <div className="text-sm font-medium">Detalhes do orçamento</div>
      
      <ClientCardInfo
        platform={platform}
        dailyBudget={dailyBudget}
        idealBudget={idealBudget}
        totalSpent={totalSpent}
        needsAdjustment={needsAdjustment}
        totalBudget={budgetAmount}
        lastFiveDaysAvg={showLastFiveDaysAvg ? lastFiveDaysAvg : undefined}
        className="mt-2"
      />
      
      {isUsingCustomBudget && customBudget && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-1 text-sm font-medium text-[#ff6e00]">
            <BadgeDollarSign size={16} />
            <span>Orçamento personalizado ativo</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-orange-50 p-2 rounded">
              <div className="text-xs text-orange-600">Valor original</div>
              <div className="font-medium">{formatCurrency(originalBudgetAmount)}</div>
            </div>
            
            <div className="bg-orange-50 p-2 rounded">
              <div className="text-xs text-orange-600">Valor personalizado</div>
              <div className="font-medium">{formatCurrency(customBudget.budget_amount)}</div>
            </div>
            
            <div className="bg-orange-50 p-2 rounded">
              <div className="text-xs text-orange-600 flex items-center gap-1">
                <CalendarDays size={12} />
                <span>Início</span>
              </div>
              <div className="font-medium">{new Date(customBudget.start_date).toLocaleDateString('pt-BR')}</div>
            </div>
            
            <div className="bg-orange-50 p-2 rounded">
              <div className="text-xs text-orange-600 flex items-center gap-1">
                <Clock size={12} />
                <span>Término</span>
              </div>
              <div className="font-medium">{new Date(customBudget.end_date).toLocaleDateString('pt-BR')}</div>
            </div>
          </div>
          
          {customBudget.description && (
            <div className="bg-orange-50 p-2 rounded">
              <div className="text-xs text-orange-600">Descrição</div>
              <div className="text-sm">{customBudget.description}</div>
            </div>
          )}
        </div>
      )}
      
      <div className="text-xs text-gray-500 mt-2">
        ID da Conta: {client[`${platform}_account_id`] || "Não configurado"}
      </div>
    </div>
  );
}
