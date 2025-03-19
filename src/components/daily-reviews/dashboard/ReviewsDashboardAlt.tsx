
import { useState, useCallback } from "react";
import { useBatchReview } from "../hooks/useBatchReview";
import { formatDateInBrasiliaTz } from "../summary/utils";
import { Card } from "@/components/ui/card";
import { Loader, AlertCircle, Search, Inbox, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClientAltCard } from "./ClientAltCard";
import { sortClientsByName } from "./utils/clientSorting";

interface ReviewsDashboardAltProps {
  onViewClientDetails: (clientId: string) => void;
}

export const ReviewsDashboardAlt = ({ onViewClientDetails }: ReviewsDashboardAltProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { 
    clientsWithReviews, 
    isLoading, 
    processingClients, 
    reviewSingleClient, 
    reviewAllClients,
    lastBatchReviewTime,
    isBatchAnalyzing
  } = useBatchReview();
  
  // Filtrar clientes com base na pesquisa
  const filteredClients = clientsWithReviews?.filter(client => 
    client.company_name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Ordenar clientes por nome
  const sortedClients = sortClientsByName(filteredClients);

  // Agrupar por status de revisão
  const clientsWithoutMetaId = sortedClients.filter(client => !client.meta_account_id);
  const clientsWithMetaId = sortedClients.filter(client => client.meta_account_id);

  // Funções de manipulação
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleReviewClient = useCallback((clientId: string) => {
    console.log("Iniciando revisão para cliente:", clientId);
    reviewSingleClient(clientId);
  }, [reviewSingleClient]);

  return (
    <div className="space-y-6">
      {/* Cabeçalho com informações e controles */}
      <div className="bg-gradient-to-r from-muran-primary/10 to-muran-primary/5 rounded-lg p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-muran-dark mb-1">
              Dashboard Alternativo 1
            </h2>
            {lastBatchReviewTime && (
              <p className="text-sm text-gray-500">
                {formatDateInBrasiliaTz(lastBatchReviewTime, "'Última revisão em massa em' dd 'de' MMMM 'às' HH:mm")}
              </p>
            )}
          </div>
          
          <Button 
            onClick={reviewAllClients}
            disabled={isBatchAnalyzing || isLoading}
            className="bg-muran-primary hover:bg-muran-primary/90"
          >
            {isBatchAnalyzing ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Analisando...
              </>
            ) : (
              'Analisar Todos'
            )}
          </Button>
        </div>
        
        {/* Barra de pesquisa e filtros */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              type="text"
              placeholder="Buscar cliente por nome..."
              className="pl-10 bg-white/80"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          
          <div className="flex gap-2">
            <Badge className="bg-muran-primary text-white px-3 py-2">
              Todos ({filteredClients.length})
            </Badge>
            <Badge className="bg-gray-200 text-gray-700 hover:bg-gray-300 px-3 py-2">
              Com Meta Ads ({clientsWithMetaId.length})
            </Badge>
            <Badge className="bg-gray-200 text-gray-700 hover:bg-gray-300 px-3 py-2">
              Sem Meta Ads ({clientsWithoutMetaId.length})
            </Badge>
          </div>
        </div>
      </div>

      {/* Estado de carregamento */}
      {isLoading ? (
        <div className="py-8 flex justify-center items-center">
          <Loader className="animate-spin w-8 h-8 text-muran-primary" />
          <span className="ml-3 text-gray-500">Carregando clientes...</span>
        </div>
      ) : filteredClients.length === 0 ? (
        <Card className="py-12 text-center">
          <Inbox className="mx-auto mb-4 text-gray-400" size={32} />
          <p className="text-gray-500">Nenhum cliente encontrado com os filtros atuais.</p>
        </Card>
      ) : (
        <>
          {/* Lista de clientes em formato de tabela */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Cliente</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Orçamento Mensal</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Gasto Total</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Orç. Diário Atual</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Orç. Diário Sugerido</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {clientsWithMetaId.map((client) => (
                  <ClientAltCard
                    key={client.id}
                    client={client}
                    onReviewClient={handleReviewClient}
                    isProcessing={processingClients.includes(client.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Clientes sem configuração Meta Ads */}
          {clientsWithoutMetaId.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-3 text-gray-600 flex items-center">
                <Filter className="mr-2" size={18} />
                Clientes sem configuração de Meta Ads ({clientsWithoutMetaId.length})
              </h3>
              
              <div className="bg-white/50 rounded-lg shadow-sm overflow-hidden">
                <table className="w-full">
                  <tbody className="divide-y divide-gray-100">
                    {clientsWithoutMetaId.map((client) => (
                      <ClientAltCard
                        key={client.id}
                        client={client}
                        onReviewClient={handleReviewClient}
                        isProcessing={processingClients.includes(client.id)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
