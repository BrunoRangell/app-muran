import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientAltCard } from "./ClientAltCard";
import { useClientReviewAnalysis } from "../hooks/useClientReviewAnalysis";
import { FilterOptions } from "./components/FilterOptions";
import { useState } from "react";
import { filterClientsByName, filterClientsByAdjustment } from "./utils/clientFiltering";
import { Button } from "@/components/ui/button";
import { RotateCw } from "lucide-react";

interface MetaDashboardCardProps {
  onViewClientDetails: (clientId: string) => void;
  onAnalyzeAll?: () => Promise<void>;
}

export const MetaDashboardCard = ({ onViewClientDetails, onAnalyzeAll }: MetaDashboardCardProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyAdjustments, setShowOnlyAdjustments] = useState(false);
  
  const { 
    filteredClients, 
    isLoading, 
    processingClients, 
    reviewClient,
    reviewAllClients,
    metaAccounts
  } = useClientReviewAnalysis();

  const filteredByName = filteredClients ? filterClientsByName(filteredClients, searchQuery) : [];
  const finalFilteredClients = filterClientsByAdjustment(filteredByName, showOnlyAdjustments);

  const handleAnalyzeAll = async () => {
    if (reviewAllClients) {
      await reviewAllClients();
    } else if (onAnalyzeAll) {
      await onAnalyzeAll();
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2 flex flex-row justify-between items-center">
        <CardTitle className="text-xl font-bold text-[#321e32]">
          Revisão de Orçamentos Meta
        </CardTitle>
        <div className="text-right">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleAnalyzeAll} 
            className="mr-2"
            title="Atualizar contas Meta"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
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
        ) : (
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
                {finalFilteredClients.length > 0 ? (
                  finalFilteredClients.flatMap((client) => {
                    // Filtrar contas Meta para este cliente
                    const clientMetaAccounts = metaAccounts.filter(
                      account => account.client_id === client.id
                    );

                    // Se não houver contas meta na nova estrutura, usar a conta legada se existir
                    if (clientMetaAccounts.length === 0 && client.meta_account_id) {
                      return [
                        <ClientAltCard
                          key={client.id}
                          client={client}
                          onReviewClient={reviewClient}
                          isProcessing={processingClients.includes(client.id)}
                        />
                      ];
                    }

                    // Se houver contas na nova estrutura, renderizar um card para cada conta
                    return clientMetaAccounts.map(account => (
                      <ClientAltCard
                        key={`${client.id}-${account.account_id}`}
                        client={client}
                        metaAccount={account}
                        onReviewClient={reviewClient}
                        isProcessing={processingClients.includes(client.id)}
                      />
                    ));
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-500">
                      Nenhum cliente encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="mt-4 flex justify-end">
          <Button 
            onClick={handleAnalyzeAll}
            className="bg-[#ff6e00] hover:bg-[#e66300] text-white"
          >
            Analisar Todos
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
