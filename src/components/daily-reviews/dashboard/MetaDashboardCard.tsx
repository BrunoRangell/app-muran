
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
    reviewClient,
    reviewAllClients,
    metaAccounts,
    isProcessingAccount
  } = useClientReviewAnalysis();

  console.log("============ DIAGNÓSTICO RENDERIZAÇÃO METADASHBOARDCARD ============");
  console.log("1. Todos os clientes recebidos:", filteredClients);
  console.log("2. Todas as contas Meta:", metaAccounts);
  
  // Verificar se há contas da Sorrifácil
  const sorrifacilClients = filteredClients?.filter(client => 
    client.company_name.toLowerCase().includes("sorrifacil"));
  console.log("3. Clientes Sorrifácil encontrados:", sorrifacilClients);
  
  // Verificar contas Meta da Sorrifácil
  const sorrifacilMetaAccounts = sorrifacilClients?.length > 0 
    ? metaAccounts.filter(account => 
        sorrifacilClients.some(client => client.id === account.client_id))
    : [];
  console.log("4. Contas Meta da Sorrifácil:", sorrifacilMetaAccounts);

  const filteredByName = filteredClients ? filterClientsByName(filteredClients, searchQuery) : [];
  console.log("5. Clientes filtrados por nome:", filteredByName);
  
  const finalFilteredClients = filterClientsByAdjustment(filteredByName, showOnlyAdjustments);
  console.log("6. Clientes após filtro de ajustes:", finalFilteredClients);
  
  // Log detalhado do processo de mapeamento das contas Meta aos clientes
  console.log("7. Iniciando processo de mapeamento cliente-contas...");

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
                  finalFilteredClients.flatMap((client, clientIndex) => {
                    // Contas Meta associadas a este cliente
                    const clientMetaAccounts = metaAccounts.filter(
                      account => account.client_id === client.id && account.status === 'active'
                    );

                    console.log(`9. Cliente ${client.company_name} (${client.id}): ${clientMetaAccounts.length} contas Meta`);
                    console.log(`   Contas Meta:`, clientMetaAccounts);

                    // Se o cliente tem contas Meta específicas, criar um card para cada uma
                    if (clientMetaAccounts.length > 0) {
                      return clientMetaAccounts.map((account, accountIndex) => {
                        const uniqueKey = `${client.id}-${account.account_id}-${accountIndex}`;
                        console.log(`   Renderizando card para ${client.company_name} - conta ${account.account_name} (${account.account_id}) com chave ${uniqueKey}`);
                        
                        return (
                          <ClientAltCard
                            key={uniqueKey}
                            client={client}
                            metaAccount={account}
                            onReviewClient={reviewClient}
                            isProcessing={isProcessingAccount(client.id, account.account_id)}
                          />
                        );
                      });
                    }

                    // Se não tem contas específicas, mostrar um card padrão
                    console.log(`   Renderizando card padrão para ${client.company_name} sem contas Meta específicas`);
                    return [
                      <ClientAltCard
                        key={`${client.id}-default-${clientIndex}`}
                        client={client}
                        onReviewClient={reviewClient}
                        isProcessing={isProcessingAccount(client.id)}
                      />
                    ];
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
