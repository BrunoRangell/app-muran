
import { AlertCircle } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const EmptyState = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="text-amber-500" />
          Nenhuma revisão encontrada para hoje
        </CardTitle>
        <CardDescription>
          Execute análises de clientes para ver o resumo do dia
        </CardDescription>
      </CardHeader>
    </Card>
  );
};
