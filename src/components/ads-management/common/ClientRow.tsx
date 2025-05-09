
import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ChevronRight, TrendingDown, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { useBatchOperations } from "./hooks/useBatchOperations";
import { PlatformType } from "./types";

interface ClientRowProps {
  client: any;
  platform: PlatformType;
}

export function ClientRow({ client, platform }: ClientRowProps) {
  const { reviewClient, processingIds, isProcessingAccount } = useBatchOperations({
    platform
  });
  
  // Determinar dados específicos da plataforma
  const accountName = client[`${platform}_account_name`] || "Conta Principal";
  const accountId = client[`${platform}_account_id`];
  const spentAmount = client.review?.[`${platform}_total_spent`] || 0;
  const budgetAmount = client.budget_amount || 0;
  const spentPercentage = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;
  const needsAdjustment = client.needsAdjustment;
  const currentDailyBudget = client.review?.[`${platform}_daily_budget_current`] || 0;
  const idealDailyBudget = client.budgetCalculation?.idealDailyBudget || 0;
  const budgetDifference = client.budgetCalculation?.budgetDifference || 0;
  
  // Verificar estado de processamento
  const isProcessing = processingIds.includes(client.id) || 
    isProcessingAccount(client.id, accountId);

  return (
    <div className={`flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-white rounded-lg shadow-sm border ${
      needsAdjustment ? 'border-amber-300' : 'border-gray-100'
    } gap-4`}>
      <div className="flex items-center space-x-4 w-full md:w-auto">
        <div>
          <div className="flex items-center">
            {needsAdjustment && <AlertTriangle size={16} className="text-amber-500 mr-1" />}
            <h3 className="font-medium text-gray-800">{client.company_name}</h3>
          </div>
          <p className="text-sm text-gray-500">{accountName}</p>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
        <div className="flex items-center space-x-4">
          <div>
            <div className="text-xs text-gray-500">Orçamento</div>
            <div className="text-sm font-medium">{formatCurrency(budgetAmount)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Gasto</div>
            <div className="text-sm font-medium">
              {formatCurrency(spentAmount)}
              <span className={`text-xs ml-1 ${
                spentPercentage > 90 ? "text-red-500" :
                spentPercentage > 70 ? "text-amber-500" :
                "text-emerald-500"
              }`}>
                ({Math.round(spentPercentage)}%)
              </span>
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Diário Atual / Ideal</div>
            <div className="text-sm font-medium">
              {formatCurrency(currentDailyBudget)} / {formatCurrency(idealDailyBudget)}
            </div>
          </div>
        </div>
        
        {needsAdjustment && (
          <div className="flex items-center space-x-1 px-2 py-1 bg-amber-50 rounded-md border border-amber-100">
            {budgetDifference > 0 ? (
              <TrendingUp size={14} className="text-green-500" />
            ) : (
              <TrendingDown size={14} className="text-red-500" />
            )}
            <span className="text-xs">
              Ajuste: <span className="font-medium">{formatCurrency(Math.abs(budgetDifference))}</span>
              {budgetDifference > 0 ? ' a mais' : ' a menos'}
            </span>
          </div>
        )}
        
        <Button
          variant="default"
          size="sm"
          className="bg-[#ff6e00] hover:bg-[#ff6e00]/90"
          onClick={() => reviewClient(client.id, accountId)}
          disabled={isProcessing}
        >
          {isProcessing ? "..." : "Revisar"}
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
