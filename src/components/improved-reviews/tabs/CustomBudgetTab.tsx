
import { CustomBudgetManager } from "@/components/revisao-nova/CustomBudgetManager";
import { TooltipProvider } from "@/components/ui/tooltip";

export function CustomBudgetTab() {
  return (
    <div className="space-y-6">
      <TooltipProvider>
        <CustomBudgetManager 
          /* Removendo o prop viewMode que não existe na interface de props */
        />
      </TooltipProvider>
    </div>
  );
}
