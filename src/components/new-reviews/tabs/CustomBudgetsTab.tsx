
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function CustomBudgetsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Orçamentos Personalizados</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-500">
          Esta página permitirá criar e gerenciar orçamentos personalizados para períodos específicos.
          Funcionalidade em desenvolvimento.
        </p>
      </CardContent>
    </Card>
  );
}
