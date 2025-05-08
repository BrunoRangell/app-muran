
import { CustomBudgetManager } from "@/components/revisao-nova/CustomBudgetManager";
import { TooltipProvider } from "@/components/ui/tooltip";

export function CustomBudgetTab() {
  return (
    <div className="space-y-6">
      <TooltipProvider>
        <CustomBudgetManager viewMode="cards" />
      </TooltipProvider>
    </div>
  );
}
