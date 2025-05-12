import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LoadingView } from "@/components/daily-reviews/dashboard/components/LoadingView";
import { EmptyStateView } from "@/components/daily-reviews/dashboard/components/EmptyStateView";

export function GoogleAdsTab() {
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  
  // Este componente será expandido posteriormente com a funcionalidade completa
  
  if (isLoading) {
    return <LoadingView />;
  }
  
  if (clients.length === 0) {
    return (
      <EmptyStateView message="Nenhum cliente Google Ads encontrado. Adicione clientes ou ajuste seus filtros." />
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Google Ads</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-500">
          Este módulo permitirá gerenciar revisões diárias de campanhas de Google Ads.
          Funcionalidade em desenvolvimento.
        </p>
      </CardContent>
    </Card>
  );
}
