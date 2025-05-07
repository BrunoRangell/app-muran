
import { Card, CardContent } from "@/components/ui/card";
import { Inbox, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface EmptyStateViewProps {
  isFiltered?: boolean;
}

export const EmptyStateView = ({ isFiltered }: EmptyStateViewProps) => {
  return (
    <Card className="py-12">
      <CardContent className="flex flex-col items-center justify-center space-y-4">
        {isFiltered ? (
          <>
            <AlertTriangle className="h-12 w-12 text-amber-500" />
            <p className="text-lg font-medium text-gray-600">Nenhum cliente encontrado com os filtros atuais</p>
            <p className="text-sm text-gray-500">Tente ajustar os critérios de busca ou filtros aplicados</p>
          </>
        ) : (
          <>
            <Inbox className="h-12 w-12 text-gray-400" />
            <p className="text-lg font-medium text-gray-600">Nenhum cliente com Meta Ads configurado</p>
            <p className="text-sm text-gray-500 max-w-md text-center">
              Para começar a gerenciar orçamentos do Meta Ads, adicione IDs de contas Meta aos seus clientes
            </p>
            <Button asChild className="mt-4">
              <Link to="/revisao-nova?tab=budgets">Configurar orçamentos</Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
