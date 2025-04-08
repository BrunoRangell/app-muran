
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Clock, AlertCircle, Check, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ClientReviewListProps {
  clients: any[];
  isLoading: boolean;
  error: Error | null;
  onViewDetails: (clientId: string) => void;
  onRefresh: () => void;
}

export function ClientReviewList({ 
  clients, 
  isLoading, 
  error, 
  onViewDetails, 
  onRefresh 
}: ClientReviewListProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Renderizar estado de carregamento
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-9 w-24" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // Renderizar estado de erro
  if (error) {
    return (
      <div className="p-6 text-center border rounded-lg bg-red-50">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <h3 className="text-lg font-medium text-red-800 mb-1">
          Erro ao carregar clientes
        </h3>
        <p className="text-sm text-red-600 mb-4">
          {error.message || "Ocorreu um erro ao carregar os clientes."}
        </p>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  // Renderizar lista vazia
  if (clients.length === 0) {
    return (
      <div className="p-6 text-center border rounded-lg bg-gray-50">
        <h3 className="text-lg font-medium text-gray-800 mb-1">
          Nenhum cliente com Meta Ads encontrado
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Não há clientes configurados com contas do Meta Ads para revisão.
        </p>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar lista
        </Button>
      </div>
    );
  }

  // Renderizar lista de clientes
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          size="sm" 
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Atualizando...' : 'Atualizar lista'}
        </Button>
      </div>

      {clients.map((client) => (
        <Card key={client.id} className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">{client.client_name}</h3>
              <div className="flex items-center text-sm text-gray-500 mt-1">
                <Clock className="h-3.5 w-3.5 mr-1" />
                <span>
                  {client.last_review_date 
                    ? `Última revisão: ${formatDate(client.last_review_date)}` 
                    : "Nenhuma revisão"}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {client.status && (
                <Badge className={
                  client.status === 'ok' ? 'bg-green-500' : 
                  client.status === 'warning' ? 'bg-amber-500' : 
                  client.status === 'overbudget' ? 'bg-red-500' : 
                  'bg-gray-500'
                }>
                  {client.status === 'ok' && <Check className="h-3 w-3 mr-1" />}
                  {client.status === 'warning' && <AlertCircle className="h-3 w-3 mr-1" />}
                  {client.status === 'overbudget' && <AlertCircle className="h-3 w-3 mr-1" />}
                  {
                    client.status === 'ok' ? 'OK' :
                    client.status === 'warning' ? 'Atenção' :
                    client.status === 'overbudget' ? 'Acima do orçamento' :
                    client.status
                  }
                </Badge>
              )}
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => onViewDetails(client.id)}
              >
                Detalhes
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
