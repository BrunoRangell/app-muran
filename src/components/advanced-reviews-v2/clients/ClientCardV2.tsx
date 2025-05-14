
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface BudgetData {
  monthlyBudget: number;
  totalSpent: number;
  currentDailyBudget: number;
  idealDailyBudget: number;
  remainingBudget: number;
  remainingDays: number;
  needsAdjustment: boolean;
  isCustomBudget?: boolean;
  customBudgetEndDate?: string;
}

interface ClientCardProps {
  clientId: string;
  clientName: string;
  accountName?: string;
  accountId?: string;
  budgetData?: BudgetData;
  hasReview: boolean;
  isProcessing: boolean;
  isSelected?: boolean;
  onProcess: (clientId: string, accountId?: string) => void;
  onViewDetails?: (clientId: string) => void;
  onSelect?: (clientId: string, isSelected: boolean) => void;
}

export function ClientCardV2({
  clientId,
  clientName,
  accountName,
  accountId,
  budgetData,
  hasReview,
  isProcessing,
  isSelected = false,
  onProcess,
  onViewDetails,
  onSelect
}: ClientCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleProcess = () => {
    onProcess(clientId, accountId);
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(clientId);
    }
  };

  const handleToggleSelect = () => {
    if (onSelect) {
      onSelect(clientId, !isSelected);
    }
  };

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const getSpentPercentage = () => {
    if (!budgetData) return 0;
    return Math.min(100, (budgetData.totalSpent / budgetData.monthlyBudget) * 100);
  };

  // Determinar status para estilização
  const getStatusInfo = () => {
    if (!budgetData) {
      return {
        color: "bg-gray-200",
        textColor: "text-gray-500",
        label: "Sem dados"
      };
    }
    
    if (budgetData.needsAdjustment) {
      const difference = budgetData.idealDailyBudget - budgetData.currentDailyBudget;
      if (difference > 0) {
        return {
          color: "bg-orange-100",
          textColor: "text-orange-700",
          label: "Aumentar orçamento"
        };
      } else {
        return {
          color: "bg-blue-100",
          textColor: "text-blue-700",
          label: "Reduzir orçamento"
        };
      }
    }
    
    return {
      color: "bg-green-100",
      textColor: "text-green-700",
      label: "Orçamento adequado"
    };
  };

  const statusInfo = getStatusInfo();
  const spentPercentage = getSpentPercentage();

  return (
    <Card className={`overflow-hidden border ${isSelected ? "border-[#ff6e00]" : ""}`}>
      <CardHeader className="p-4 pb-2 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {onSelect && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={handleToggleSelect}
                className="h-4 w-4 rounded border-gray-300 text-[#ff6e00] focus:ring-[#ff6e00]"
              />
            )}
            <div>
              <h3 className="font-medium text-[#321e32]">{clientName}</h3>
              {accountName && (
                <p className="text-sm text-gray-500">Conta: {accountName}</p>
              )}
            </div>
          </div>
          
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleExpand}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? 
                <ChevronUp className="h-4 w-4" /> : 
                <ChevronDown className="h-4 w-4" />
              }
            </Button>
          </div>
        </div>
        
        <div className="mt-2">
          <Badge variant="outline" className={`${statusInfo.color} ${statusInfo.textColor}`}>
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-2">
        {!budgetData ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          <>
            {/* Progresso do orçamento */}
            <div className="mt-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Total gasto</span>
                <span>
                  {formatCurrency(budgetData.totalSpent)} de {formatCurrency(budgetData.monthlyBudget)}
                </span>
              </div>
              <Progress value={spentPercentage} className="h-2" />
            </div>

            {/* Informações extras quando expandido */}
            {isExpanded && (
              <div className="mt-3 pt-3 border-t text-sm space-y-2">
                <div className="flex justify-between">
                  <span>Orç. diário atual:</span>
                  <span className="font-medium">{formatCurrency(budgetData.currentDailyBudget)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Orç. diário ideal:</span>
                  <span className="font-medium">{formatCurrency(budgetData.idealDailyBudget)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Dias restantes:</span>
                  <span>{budgetData.remainingDays}</span>
                </div>
                {budgetData.isCustomBudget && (
                  <div className="flex justify-between text-[#ff6e00]">
                    <span>Orçamento personalizado</span>
                    <span>Até {new Date(budgetData.customBudgetEndDate!).toLocaleDateString('pt-BR')}</span>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 flex justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleViewDetails}
              >
                Ver detalhes
              </Button>
              <Button
                variant="default"
                size="sm"
                className="flex-1 bg-[#ff6e00] hover:bg-[#e66200]"
                disabled={isProcessing}
                onClick={handleProcess}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Revisando...
                  </>
                ) : (
                  "Revisar agora"
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
