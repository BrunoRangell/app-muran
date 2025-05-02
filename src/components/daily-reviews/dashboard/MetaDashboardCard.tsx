
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientAltCard } from "./ClientAltCard";
import { useClientReviewAnalysis } from "../hooks/useClientReviewAnalysis";
import { FilterOptions } from "./components/FilterOptions";
import { useState } from "react";
import { filterClientsByName, filterClientsByAdjustment } from "./utils/clientFiltering";
import { Button } from "@/components/ui/button";
import { RotateCw } from "lucide-react";
import { ClientWithReview, MetaAccount } from "../hooks/types/reviewTypes";

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
  console.log("1. Todos os clientes recebidos:", filteredClients?.length);
  console.log("2. Todas as contas Meta:", metaAccounts?.length);

  // Log específico para Sorrifácil para diagnóstico
  const sorrifacilClients = filteredClients?.filter(client => 
    client.company_name.toLowerCase().includes("sorrifacil")) || [];
  console.log("3. Clientes Sorrifácil encontrados:", sorrifacilClients.length);
  console.log("   Detalhes dos clientes Sorrifácil:", sorrifacilClients);
  
  const sorrifacilMetaAccounts = metaAccounts.filter(account => 
    sorrifacilClients.some(client => client.id === account.client_id));
  console.log("4. Contas Meta da Sorrifácil:", sorrifacilMetaAccounts.length);
  console.log("   Detalhes das contas Meta da Sorrifácil:", sorrifacilMetaAccounts);

  const filteredByName = filteredClients ? filterClientsByName(filteredClients, searchQuery) : [];
  const finalFilteredClients = filterClientsByAdjustment(filteredByName, showOnlyAdjustments);

  const handleAnalyzeAll = async () => {
    if (reviewAllClients) {
      await reviewAllClients();
    } else if (onAnalyzeAll) {
      await onAnalyzeAll();
    }
  };

  // Função para renderizar os cards de acordo com as contas Meta
  const renderClientCards = () => {
    if (!finalFilteredClients || finalFilteredClients.length === 0) {
      return (
        <tr>
          <td colSpan={6} className="text-center py-10 text-gray-500">
            Nenhum cliente encontrado
          </td>
        </tr>
      );
    }

    const rows: JSX.Element[] = [];
    
    // Primeiro, criar um mapa dos clientes por ID para fácil acesso
    const clientsMap = new Map<string, ClientWithReview>();
    finalFilteredClients.forEach(client => {
      clientsMap.set(client.id, client);
    });

    // Iterar através de todos os clientes únicos
    const uniqueClientIds = Array.from(new Set(finalFilteredClients.map(c => c.id)));
    
    for (const clientId of uniqueClientIds) {
      const client = clientsMap.get(clientId);
      if (!client) continue;
      
      // Buscar todas as contas Meta ativas para este cliente
      const clientMetaAccounts = metaAccounts.filter(
        account => account.client_id === clientId && account.status === 'active'
      );
      
      console.log(`Cliente ${client.company_name} (${clientId}): ${clientMetaAccounts.length} contas Meta ativas`);
      
      // Se o cliente tem contas Meta ativas, criar um card para cada uma
      if (clientMetaAccounts.length > 0) {
        clientMetaAccounts.forEach((account) => {
          console.log(`Renderizando card para ${client.company_name} - conta ${account.account_name} (${account.account_id})`);
          
          // Criamos uma cópia do cliente com informações específicas para esta conta
          const clientWithAccountInfo = {
            ...client,
            // Explicitamente definimos meta_account_id para garantir que é usado
            meta_account_id: account.account_id,
          };
          
          rows.push(
            <ClientAltCard
              key={`${clientId}-${account.account_id}`}
              client={clientWithAccountInfo}
              metaAccount={account}
              onReviewClient={reviewClient}
              isProcessing={isProcessingAccount(clientId, account.account_id)}
            />
          );
        });
      } else {
        // Se não tem contas específicas, mostrar um card padrão
        console.log(`Renderizando card padrão para ${client.company_name} sem contas Meta específicas`);
        rows.push(
          <ClientAltCard
            key={`${clientId}-default`}
            client={client}
            onReviewClient={reviewClient}
            isProcessing={isProcessingAccount(clientId)}
          />
        );
      }
    }

    return rows;
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
                {renderClientCards()}
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
