
import { Building2, BadgeDollarSign, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDateBr } from "@/utils/dateFormatter";

interface CardHeaderProps {
  clientName: string;
  accountName: string;
  isUsingCustomBudget: boolean;
  needsAdjustment: boolean;
  customBudget: any | null;
}

export function CardHeader({ 
  clientName, 
  accountName, 
  isUsingCustomBudget, 
  needsAdjustment,
  customBudget
}: CardHeaderProps) {
  return (
    <div className="flex justify-between items-start">
      <div className="space-y-1">
        <h3 className="font-medium line-clamp-1 flex items-center gap-1">
          <Building2 className="h-4 w-4 text-[#ff6e00]" />
          {clientName}
        </h3>
        <p className="text-sm text-gray-500">{accountName}</p>
      </div>
      <div className="flex items-center gap-2">
        {isUsingCustomBudget && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <BadgeDollarSign className="h-5 w-5 text-[#ff6e00]" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="p-2">
                  <p className="font-medium">Orçamento Personalizado Ativo</p>
                  <p className="text-sm">
                    Período: {formatDateBr(customBudget?.start_date)} a {formatDateBr(customBudget?.end_date)}
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {needsAdjustment && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="p-2">Ajuste de orçamento recomendado</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}
