
import { CustomBudgetManager } from "@/components/revisao-nova/CustomBudgetManager";

export function CustomBudgetTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Orçamentos Personalizados</h2>
      <CustomBudgetManager />
    </div>
  );
}
