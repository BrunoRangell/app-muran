
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function BudgetsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Orçamentos</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-500">
          Esta página permitirá gerenciar os orçamentos mensais dos clientes.
          Funcionalidade em desenvolvimento.
        </p>
      </CardContent>
    </Card>
  );
}
