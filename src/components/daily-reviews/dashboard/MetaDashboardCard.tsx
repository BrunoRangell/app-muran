
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientAltCard } from "./ClientAltCard";
import { useClientReviewAnalysis } from "../hooks/useClientReviewAnalysis";
import { FilterOptions } from "./components/FilterOptions";
import { useState } from "react";
import { filterClientsByName, filterClientsByAdjustment } from "./utils/clientFiltering";
import { Calendar, Loader } from "lucide-react";
import { CompactNextReviewCountdown } from "./components/CompactNextReviewCountdown";
import { useBatchReview } from "../hooks/useBatchReview";

interface MetaDashboardCardProps {
  onViewClientDetails: (clientId: string) => void;
}

export const MetaDashboardCard = ({ onViewClientDetails }: MetaDashboardCardProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyAdjustments, setShowOnlyAdjustments] = useState(false);
  
  // Usar o hook useBatchReview para acessar a função reviewAllClients
  const { 
    clientsWithReviews: filteredClients, 
    isLoading, 
    processingClients, 
    reviewSingleClient: reviewClient,
    reviewAllClients,
    lastBatchReviewTime,
    isBatchAnalyzing
  } = useBatchReview();
  
  const filteredByName = filteredClients ? filterClientsByName(filteredClients, searchQuery) : [];
  const finalFilteredClients = filterClientsByAdjustment(filteredByName, showOnlyAdjustments);

  console.log("[MetaDashboardCard] Renderizando com:", {
    clientsCount: finalFilteredClients.length,
    isLoading,
    processingClientsCount: processingClients.length,
    isBatchAnalyzing
  });

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2 flex flex-row justify-between items-center">
        <CardTitle className="text-xl font-bold text-[#321e32]">
          Revisão de Orçamentos Meta
        </CardTitle>
        <div className="text-right flex items-center gap-3">
          <div className="text-sm text-gray-500 flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            <span>
              {lastBatchReviewTime 
                ? new Date(lastBatchReviewTime).toLocaleString('pt-BR')
                : 'Nenhuma revisão anterior'}
            </span>
          </div>
          
          <button
            onClick={() => reviewAllClients()}
            disabled={isBatchAnalyzing || isLoading}
            className="bg-[#ff6e00] text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-[#e06000] transition-colors disabled:opacity-50"
          >
            {isBatchAnalyzing ? (
              <>
                <Loader className="inline-block mr-1 h-3.5 w-3.5 animate-spin" />
                Analisando...
              </>
            ) : (
              'Analisar todos'
            )}
          </button>
          
          <div>
            <CompactNextReviewCountdown onAnalyzeAll={reviewAllClients} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar cliente por nome..."
            className="w-full h-10 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ff6e00] focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <FilterOptions 
          showOnlyAdjustments={showOnlyAdjustments}
          onShowOnlyAdjustmentsChange={setShowOnlyAdjustments}
        />

        {isLoading ? (
          <div className="text-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff6e00] mx-auto"></div>
            <p className="mt-2 text-gray-500">Carregando clientes...</p>
          </div>
        ) : finalFilteredClients.length > 0 ? (
          <div className="overflow-x-auto mt-4">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orçamento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gasto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Atual</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recomendado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody>
                {finalFilteredClients.map((client) => (
                  <ClientAltCard
                    key={client.id}
                    client={client}
                    onReviewClient={reviewClient}
                    isProcessing={processingClients.includes(client.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center p-10">
            <p className="text-gray-500">Nenhum cliente encontrado</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
