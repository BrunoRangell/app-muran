
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientAltCard } from "./ClientAltCard";
import { useBatchReview } from "../hooks/useBatchReview";
import { FilterOptions } from "./components/FilterOptions";
import { useState } from "react";
import { filterClientsByName, filterClientsByAdjustment } from "./utils/clientFiltering";
import { CronScheduleMonitor } from "./components/CronScheduleMonitor";

interface MetaDashboardCardProps {
  onViewClientDetails: (clientId: string) => void;
}

export const MetaDashboardCard = ({ onViewClientDetails }: MetaDashboardCardProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyAdjustments, setShowOnlyAdjustments] = useState(false);
  
  const { 
    clientsWithReviews, 
    isLoading, 
    processingClients, 
    reviewSingleClient,
    reviewAllClients,
    lastBatchReviewTime,
    isBatchAnalyzing
  } = useBatchReview();
  
  const filteredByName = clientsWithReviews ? filterClientsByName(clientsWithReviews, searchQuery) : [];
  const finalFilteredClients = filterClientsByAdjustment(filteredByName, showOnlyAdjustments);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2 flex flex-row justify-between items-center">
        <CardTitle className="text-xl font-bold text-[#321e32]">
          Revisão de Orçamentos Meta
        </CardTitle>
        <div className="flex gap-2">
          <button
            onClick={() => reviewAllClients()}
            disabled={isBatchAnalyzing || isLoading}
            className="bg-[#ff6e00] hover:bg-orange-600 text-white px-3 py-1.5 rounded text-sm font-medium flex items-center"
          >
            {isBatchAnalyzing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Analisando...
              </>
            ) : (
              <>Analisar todos</>
            )}
          </button>
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

        <CronScheduleMonitor />

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
                    onReviewClient={reviewSingleClient}
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
