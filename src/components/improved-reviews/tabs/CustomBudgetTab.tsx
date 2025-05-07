
import { CustomBudgetManager } from "@/components/revisao-nova/CustomBudgetManager";

export function CustomBudgetTab() {
  return (
    <div className="space-y-6">
      <CustomBudgetManager viewMode="cards" />
    </div>
  );
}
