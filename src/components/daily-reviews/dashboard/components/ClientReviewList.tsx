
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface Client {
  id: string;
  company_name: string;
  meta_account_id?: string;
  lastReview?: any;
}

interface ClientReviewListProps {
  clients: Client[];
  isLoading: boolean;
  error: any;
  onViewDetails: (clientId: string) => void;
  onRefresh: () => void;
}

export const ClientReviewList = ({
  clients,
  isLoading,
  error,
  onViewDetails,
  onRefresh,
}: ClientReviewListProps) => {
  const [showOnlyWithReviews, setShowOnlyWithReviews] = useState(false);

  if (isLoading) {
    return (
      <div className="text-center py-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff6e00] mx-auto"></div>
        <p className="mt-2 text-gray-500">Carregando dados dos clientes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-500 font-medium">Erro ao carregar dados:</p>
        <p className="text-sm text-red-400">{error.message || "Erro desconhecido"}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={onRefresh}
        >
          <RefreshCw className="mr-1 h-4 w-4" /> Tentar novamente
        </Button>
      </div>
    );
  }

  if (!clients || clients.length === 0) {
    return (
      <div className="text-center py-6 bg-gray-50 rounded-md">
        <p className="text-gray-500">Nenhum cliente com revisão encontrado</p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2"
          onClick={onRefresh}
        >
          <RefreshCw className="mr-1 h-4 w-4" /> Atualizar
        </Button>
      </div>
    );
  }

  const filteredClients = showOnlyWithReviews 
    ? clients.filter(client => client.lastReview) 
    : clients;

  return (
    <div>
      <div className="mb-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={showOnlyWithReviews}
            onChange={() => setShowOnlyWithReviews(!showOnlyWithReviews)}
            className="mr-2"
          />
          <span className="text-sm">Mostrar apenas clientes com revisões recentes</span>
        </label>
      </div>

      <div className="space-y-2">
        {filteredClients.map((client) => (
          <div 
            key={client.id}
            className="p-3 border rounded-md hover:bg-gray-50 transition-colors"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{client.company_name}</p>
                <p className="text-sm text-gray-500">
                  {client.meta_account_id 
                    ? `ID Meta: ${client.meta_account_id}` 
                    : "Sem ID Meta configurado"}
                </p>
              </div>
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewDetails(client.id)}
                >
                  Detalhes
                </Button>
              </div>
            </div>
            {client.lastReview && (
              <div className="mt-2 text-sm bg-gray-50 p-2 rounded">
                <p className="text-xs text-gray-500">
                  Última revisão: {new Date(client.lastReview.created_at).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
