import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LoadingView } from "@/components/daily-reviews/dashboard/components/LoadingView";
import { EmptyStateView } from "@/components/daily-reviews/dashboard/components/EmptyStateView";

export function MetaAdsTab() {
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  
  // Este componente será expandido posteriormente com a funcionalidade completa
  
  if (isLoading) {
    return <LoadingView />;
  }
  
  if (clients.length === 0) {
    return (
      <EmptyStateView message="Nenhum cliente Meta Ads encontrado. Adicione clientes ou ajuste seus filtros." />
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Meta Ads</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-500">
          Este módulo permitirá gerenciar revisões diárias de campanhas de Meta Ads.
          Funcionalidade em desenvolvimento.
        </p>
      </CardContent>
    </Card>
  );
}
