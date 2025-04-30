
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
  console.log("1. Todos os clientes recebidos:", filteredClients?.length);
  console.log("2. Todas as contas Meta:", metaAccounts?.length);

  const sorrifacilClients = filteredClients?.filter(client => 
    client.company_name.toLowerCase().includes("sorrifacil")) || [];
  console.log("3. Clientes Sorrifácil encontrados:", sorrifacilClients.length);
  
  const sorrifacilMetaAccounts = metaAccounts.filter(account => 
    sorrifacilClients.some(client => client.id === account.client_id));
  console.log("4. Contas Meta da Sorrifácil:", sorrifacilMetaAccounts.length, sorrifacilMetaAccounts);

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

    // Agrupar clientes por ID para facilitar o processamento
    const clientsById = new Map();
    finalFilteredClients.forEach(client => {
      if (!clientsById.has(client.id)) {
        clientsById.set(client.id, client);
      }
    });

    const rows: JSX.Element[] = [];

    // Para cada cliente, verificar se tem contas Meta associadas
    clientsById.forEach((client, clientId) => {
      // Buscar todas as contas Meta para este cliente
      const clientMetaAccounts = metaAccounts.filter(
        account => account.client_id === clientId && account.status === 'active'
      );

      console.log(`Cliente ${client.company_name} (${clientId}): ${clientMetaAccounts.length} contas Meta`);

      // Se o cliente tem contas Meta específicas, criar um card para cada uma
      if (clientMetaAccounts.length > 0) {
        clientMetaAccounts.forEach((account, accountIndex) => {
          const uniqueKey = `${clientId}-${account.account_id}-${accountIndex}`;
          console.log(`Renderizando card para ${client.company_name} - conta ${account.account_name} (${account.account_id}) com chave ${uniqueKey}`);
          
          // Encontrar a revisão específica desta conta
          const accountClient = filteredClients?.find(c => 
            c.id === clientId && c.meta_account_id === account.account_id
          ) || client;

          rows.push(
            <ClientAltCard
              key={uniqueKey}
              client={accountClient}
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
    });

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
