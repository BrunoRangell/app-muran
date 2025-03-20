
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Filter } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";

interface FilterOptionsProps {
  showOnlyAdjustments: boolean;
  onShowOnlyAdjustmentsChange: (value: boolean) => void;
}

export const FilterOptions = ({
  showOnlyAdjustments,
  onShowOnlyAdjustmentsChange
}: FilterOptionsProps) => {
  return (
    <div className="flex items-center gap-2 pl-2">
      <div className="flex items-center space-x-2">
        <Switch 
          id="show-adjustments" 
          checked={showOnlyAdjustments}
          onCheckedChange={onShowOnlyAdjustmentsChange}
        />
        <Label htmlFor="show-adjustments" className="text-sm font-medium flex items-center">
          <Filter size={16} className="mr-1 text-gray-500" />
          Mostrar apenas clientes com ajustes necessários
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon size={14} className="ml-1 text-gray-500 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Exibe apenas clientes que precisam de ajuste no orçamento diário (diferença ≥ R$ 5). 
                Funciona tanto para orçamentos padrão quanto para orçamentos personalizados.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Label>
      </div>
    </div>
  );
};
