
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

export const ImprovedBudgetManager = () => {
  return (
    <Card>
      <CardContent className="p-8">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Gerenciador de Orçamentos</AlertTitle>
          <AlertDescription>
            A implementação completa do Gerenciador de Orçamentos será adicionada na próxima fase.
            Esta seção permitirá configurar orçamentos mensais, personalizar períodos e gerenciar várias contas por cliente.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
