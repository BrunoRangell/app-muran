
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientAltCard } from "./ClientAltCard";
import { useClientReviewAnalysis } from "../hooks/useClientReviewAnalysis";
import { FilterOptions } from "./components/FilterOptions";
import { useState } from "react";
import { filterClientsByName, filterClientsByAdjustment } from "./utils/clientFiltering";

interface MetaDashboardCardProps {
  onViewClientDetails: (clientId: string) => void;
  onAnalyzeAll?: () => Promise<void>; // Adicionando propriedade onAnalyzeAll como opcional
}

export const MetaDashboardCard = ({ onViewClientDetails, onAnalyzeAll }: MetaDashboardCardProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyAdjustments, setShowOnlyAdjustments] = useState(false);
  
  const { 
    filteredClients, 
    isLoading, 
    processingClients, 
    reviewClient,
    reviewAllClients 
  } = useClientReviewAnalysis();
  
  const filteredByName = filteredClients ? filterClientsByName(filteredClients, searchQuery) : [];
  const finalFilteredClients = filterClientsByAdjustment(filteredByName, showOnlyAdjustments);

  console.log("MetaDashboardCard - DIAGNÓSTICO FILTROS:", {
    totalClientes: filteredClients?.length || 0,
    filtradosPorNome: filteredByName.length,
    filtradosFinais: finalFilteredClients.length,
    busca: searchQuery,
    somenteAjustes: showOnlyAdjustments
  });
  
  // Log de resumo dos clientes com contas secundárias
  const clientesComContasSecundarias = finalFilteredClients.filter(c => 
    c.meta_accounts && Array.isArray(c.meta_accounts) && c.meta_accounts.length > 0
  );
  
  console.log("MetaDashboardCard - Clientes com contas secundárias:", clientesComContasSecundarias.length);
  if (clientesComContasSecundarias.length > 0) {
    clientesComContasSecundarias.forEach(c => {
      console.log(`ESTADO FINAL [${c.company_name}]:`, {
        id: c.id,
        meta_accounts: c.meta_accounts,
        total_contas: c.meta_accounts.length,
        tem_array: Array.isArray(c.meta_accounts)
      });
    });
  }

  // Função que será chamada para análise em lote
  const handleAnalyzeAll = async () => {
    // Usar a função do hook se disponível, caso contrário usar a propriedade passada
    if (reviewAllClients) {
      await reviewAllClients();
    } else if (onAnalyzeAll) {
      await onAnalyzeAll();
    }
  };

  // Log para verificar se o cliente Sorrifácil está sendo renderizado corretamente
  const sorrifacil = finalFilteredClients.find(c => c.company_name === "Sorrifácil");
  if (sorrifacil) {
    console.log("SORRIFÁCIL ENCONTRADO NA LISTA FINAL:", {
      id: sorrifacil.id,
      contas: sorrifacil.meta_accounts?.map(a => ({
        id: a.id,
        nome: a.account_name,
        isPrimary: a.is_primary
      })) || 'Sem contas',
      totalContas: sorrifacil.meta_accounts?.length || 0
    });
  } else {
    console.log("SORRIFÁCIL NÃO ENCONTRADO NA LISTA FINAL");
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2 flex flex-row justify-between items-center">
        <CardTitle className="text-xl font-bold text-[#321e32]">
          Revisão de Orçamentos Meta
        </CardTitle>
        <div className="text-right">
          {/* Este espaço permanece vazio */}
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
                {finalFilteredClients.map((client) => {
                  console.log(`RENDERIZAÇÃO [${client.company_name}]:`, {
                    id: client.id,
                    tem_meta_accounts: Boolean(client.meta_accounts),
                    é_array: Array.isArray(client.meta_accounts),
                    num_contas: Array.isArray(client.meta_accounts) ? client.meta_accounts.length : 'N/A'
                  });
                  
                  // Se o cliente tiver contas cadastradas, renderizar um card para cada
                  if (Array.isArray(client.meta_accounts) && client.meta_accounts.length > 0) {
                    console.log(`RENDERIZANDO MÚLTIPLOS CARDS [${client.company_name}]:`, {
                      total_contas: client.meta_accounts.length,
                      contas: client.meta_accounts.map(acc => ({
                        id: acc.id,
                        nome: acc.account_name
                      }))
                    });
                    
                    // Criar uma chave única para verificar o processamento
                    const getProcessingKey = (clientId, accountId) => accountId ? `${clientId}-${accountId}` : clientId;
                    
                    return client.meta_accounts.map((account, index) => {
                      const processingKey = getProcessingKey(client.id, account.id);
                      
                      console.log(`RENDERIZANDO CARD #${index+1} PARA [${client.company_name}]:`, {
                        account_id: account.id,
                        account_name: account.account_name,
                        processingKey: processingKey,
                        isProcessing: processingClients.includes(processingKey)
                      });
                      
                      return (
                        <ClientAltCard
                          key={`${client.id}-${account.id}`}
                          client={client}
                          onReviewClient={(clientId) => reviewClient(clientId, account.id)}
                          isProcessing={processingClients.includes(processingKey)}
                          accountId={account.id}
                        />
                      );
                    });
                  }
                  
                  // Se o cliente não tiver contas, renderizar um card com a configuração normal
                  return (
                    <ClientAltCard
                      key={client.id}
                      client={client}
                      onReviewClient={reviewClient}
                      isProcessing={processingClients.includes(client.id)}
                    />
                  );
                })}
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
