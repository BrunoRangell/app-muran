
import { Info, AlertTriangle } from "lucide-react";
import { 
  TooltipProvider, 
  Tooltip, 
  TooltipTrigger, 
  TooltipContent 
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface CardHeaderProps {
  clientName: string;
  accountName: string;
  isUsingCustomBudget: boolean;
  needsAdjustment: boolean;
  customBudget: any;
  hasRealData?: boolean;
  platform?: "meta" | "google";
}

export function CardHeader({ 
  clientName, 
  accountName, 
  isUsingCustomBudget, 
  needsAdjustment,
  customBudget,
  hasRealData = true,
  platform = "meta"
}: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h3 className="font-semibold text-base line-clamp-1">{clientName}</h3>
        <div className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
          <span className="line-clamp-1">{accountName}</span>
          
          {platform === "google" && !hasRealData && (
            <Badge variant="outline" className="text-yellow-600 bg-yellow-50 border-yellow-200">
              <AlertTriangle size={12} className="mr-1" />
              Sem dados da API
            </Badge>
          )}
          
          {isUsingCustomBudget && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline" className="text-[#ff6e00] bg-orange-50 border-orange-200">
                    Orç. Personalizado
                  </Badge>
                </TooltipTrigger>
                {customBudget && (
                  <TooltipContent>
                    <p>Orçamento personalizado:</p>
                    <p>{Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'}).format(customBudget.budget_amount)}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
      
      {needsAdjustment && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge className="bg-amber-100 hover:bg-amber-200 text-amber-800 border-0">
                <Info size={14} className="mr-1" />
                Ajuste necessário
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>O orçamento diário precisa ser ajustado</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
