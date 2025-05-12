
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function SettingsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-500">
          Esta página permitirá configurar opções globais para as revisões diárias.
          Funcionalidade em desenvolvimento.
        </p>
      </CardContent>
    </Card>
  );
}
