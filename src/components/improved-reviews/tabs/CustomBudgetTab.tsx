
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomBudgetManager } from "@/components/revisao-nova/CustomBudgetManager";

export function CustomBudgetTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Orçamentos Personalizados</CardTitle>
          <CardDescription>
            Configure orçamentos personalizados para clientes específicos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CustomBudgetManager />
        </CardContent>
      </Card>
    </div>
  );
}
