
import { useState, useCallback } from "react";
import { useBatchReview } from "../hooks/useBatchReview";
import { ClientsHeader } from "./ClientsHeader";
import { ClientReviewCard } from "./ClientReviewCard";
import { formatDateInBrasiliaTz } from "../summary/utils";
import { Card } from "@/components/ui/card";
import { Loader, AlertCircle } from "lucide-react";

interface ReviewsDashboardProps {
  onViewClientDetails: (clientId: string) => void;
}

export const ReviewsDashboard = ({ onViewClientDetails }: ReviewsDashboardProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { 
    clientsWithReviews, 
    isLoading, 
    processingClients, 
    reviewSingleClient, 
    reviewAllClients,
    lastReviewTime,
    refetchClients,
    isBatchAnalyzing
  } = useBatchReview();

  // Formatar data atual
  const currentDate = formatDateInBrasiliaTz(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm");
  
  // Filtrar clientes com base na pesquisa
  const filteredClients = clientsWithReviews?.filter(client => 
    client.company_name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Agrupar por status de revisão
  const clientsWithoutMetaId = filteredClients.filter(client => !client.meta_account_id);
  const clientsWithMetaId = filteredClients.filter(client => client.meta_account_id);

  // Log para depuração
  console.log("Estado atual dos clientes:", {
    total: clientsWithReviews?.length || 0,
    comMetaId: clientsWithMetaId.length,
    semMetaId: clientsWithoutMetaId.length,
    emProcessamento: processingClients.length,
    ultimaRevisao: lastReviewTime
  });
  
  // Funções de manipulação
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleReviewClient = useCallback((clientId: string) => {
    console.log("Iniciando revisão para cliente:", clientId);
    reviewSingleClient(clientId);
  }, [reviewSingleClient]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-muran-dark mb-1">
            Revisão de Orçamentos Meta Ads
          </h2>
          <p className="text-sm text-gray-500">
            {currentDate}
          </p>
          {lastReviewTime && (
            <p className="text-xs text-gray-400 mt-1">
              {formatDateInBrasiliaTz(lastReviewTime, "'Última revisão em massa em' dd 'de' MMMM 'às' HH:mm")}
            </p>
          )}
        </div>
      </div>

      <ClientsHeader 
        onSearchChange={handleSearchChange}
        onReviewAllClients={reviewAllClients}
        isLoading={isLoading}
        isBatchAnalyzing={isBatchAnalyzing}
        clientsCount={filteredClients.length}
      />

      {isLoading ? (
        <div className="py-8 flex justify-center items-center">
          <Loader className="animate-spin w-8 h-8 text-muran-primary" />
          <span className="ml-3 text-gray-500">Carregando clientes...</span>
        </div>
      ) : filteredClients.length === 0 ? (
        <Card className="py-12 text-center">
          <AlertCircle className="mx-auto mb-4 text-gray-400" size={32} />
          <p className="text-gray-500">Nenhum cliente encontrado com os filtros atuais.</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clientsWithMetaId.map(client => (
              <ClientReviewCard
                key={client.id}
                client={client}
                onViewDetails={onViewClientDetails}
                onReviewClient={handleReviewClient}
                isProcessing={processingClients.includes(client.id)}
              />
            ))}
          </div>

          {clientsWithoutMetaId.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-3 text-gray-600">
                Clientes sem configuração de Meta Ads ({clientsWithoutMetaId.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
                {clientsWithoutMetaId.map(client => (
                  <ClientReviewCard
                    key={client.id}
                    client={client}
                    onViewDetails={onViewClientDetails}
                    onReviewClient={handleReviewClient}
                    isProcessing={processingClients.includes(client.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
