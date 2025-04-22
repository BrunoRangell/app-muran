
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientAltCard } from "./ClientAltCard";
import { useClientReviewAnalysis } from "../hooks/useClientReviewAnalysis";
import { FilterOptions } from "./components/FilterOptions";
import { useState, useEffect } from "react";
import { filterClientsByName, filterClientsByAdjustment } from "./utils/clientFiltering";

interface MetaDashboardCardProps {
  onViewClientDetails: (clientId: string) => void;
  onAnalyzeAll?: () => Promise<void>; 
}

export const MetaDashboardCard = ({ onViewClientDetails, onAnalyzeAll }: MetaDashboardCardProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyAdjustments, setShowOnlyAdjustments] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  
  const { 
    filteredClients, 
    isLoading, 
    processingClients, 
    reviewClient,
    reviewAllClients 
  } = useClientReviewAnalysis();
  
  const filteredByName = filteredClients ? filterClientsByName(filteredClients, searchQuery) : [];
  const finalFilteredClients = filterClientsByAdjustment(filteredByName, showOnlyAdjustments);

  // Ativar o modo de debug com triplo clique no título
  const handleTitleClick = () => {
    setDebugMode(prev => !prev);
  };

  // Log detalhado de diagnóstico
  useEffect(() => {
    if (debugMode) {
      console.log("=== DEBUG MODE ATIVADO ===");
      console.log("MetaDashboardCard - DIAGNÓSTICO FILTROS:", {
        totalClientes: filteredClients?.length || 0,
        filtradosPorNome: filteredByName.length,
        filtradosFinais: finalFilteredClients.length,
        busca: searchQuery,
        somenteAjustes: showOnlyAdjustments
      });
      
      // Diagnóstico detalhado de clientes com contas secundárias
      const clientesComContasSecundarias = finalFilteredClients.filter(c => 
        c.meta_accounts && Array.isArray(c.meta_accounts) && c.meta_accounts.length > 0
      );
      
      console.log(`MetaDashboardCard - DEBUG: Clientes com contas secundárias (${clientesComContasSecundarias.length}):`);
      
      clientesComContasSecundarias.forEach(c => {
        console.log(`DEBUG DETALHADO [${c.company_name}]:`, {
          id: c.id,
          meta_accounts_existe: Boolean(c.meta_accounts),
          é_array: Array.isArray(c.meta_accounts),
          comprimento: Array.isArray(c.meta_accounts) ? c.meta_accounts.length : 'N/A',
          contas_detalhes: Array.isArray(c.meta_accounts) ? c.meta_accounts.map(a => ({
            id: a.id,
            account_id: a.account_id,
            nome: a.account_name,
            isPrimary: a.is_primary,
            status: a.status
          })) : 'Não é array'
        });
      });
      
      // Log específico para Sorrifácil
      const sorrifacil = finalFilteredClients.find(c => c.company_name === "Sorrifácil");
      if (sorrifacil) {
        console.log("DEBUG SORRIFÁCIL:", {
          id: sorrifacil.id,
          contas: Array.isArray(sorrifacil.meta_accounts) ? sorrifacil.meta_accounts.map(a => ({
            id: a.id,
            account_id: a.account_id,
            nome: a.account_name,
            isPrimary: a.is_primary,
            status: a.status
          })) : 'Tipo de meta_accounts: ' + typeof sorrifacil.meta_accounts,
          totalContas: Array.isArray(sorrifacil.meta_accounts) ? sorrifacil.meta_accounts.length : 0
        });
      } else {
        console.log("DEBUG: SORRIFÁCIL NÃO ENCONTRADO NA LISTA FINAL");
      }
    }
  }, [debugMode, filteredClients, filteredByName, finalFilteredClients, searchQuery, showOnlyAdjustments]);
  
  // Função que será chamada para análise em lote
  const handleAnalyzeAll = async () => {
    if (reviewAllClients) {
      await reviewAllClients();
    } else if (onAnalyzeAll) {
      await onAnalyzeAll();
    }
  };

  // Log para verificar renderização de clientes com contas secundárias
  console.log("=== RENDERIZAÇÃO DO METADASHBOARDCARD ===");
  console.log("Total de clientes filtrados:", finalFilteredClients.length);
  
  const clientesComContasSecundarias = finalFilteredClients.filter(c => 
    c.meta_accounts && Array.isArray(c.meta_accounts) && c.meta_accounts.length > 0
  );
  
  console.log("Clientes com contas secundárias:", clientesComContasSecundarias.length);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2 flex flex-row justify-between items-center">
        <CardTitle 
          className="text-xl font-bold text-[#321e32] cursor-pointer" 
          onClick={handleTitleClick}
        >
          Revisão de Orçamentos Meta {debugMode && '(Debug Mode)'}
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
                  console.log(`RENDERIZAÇÃO DE CLIENTE [${client.company_name}]:`, {
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
                        nome: acc.account_name,
                        status: acc.status
                      }))
                    });
                    
                    // Criar uma chave única para verificar o processamento
                    const getProcessingKey = (clientId, accountId) => accountId ? `${clientId}-${accountId}` : clientId;
                    
                    return client.meta_accounts
                      .filter(account => account.status === 'active') // Garantir que apenas contas ativas sejam exibidas
                      .map((account, index) => {
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
