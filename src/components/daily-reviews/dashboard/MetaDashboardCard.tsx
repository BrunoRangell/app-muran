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

  const handleTitleClick = () => {
    console.log("🚨 MODO DEBUG CLICADO");
    setDebugMode(prevMode => {
      const newMode = !prevMode;
      console.log(`🔍 Modo de debug: ${newMode ? 'ATIVADO ✅' : 'DESATIVADO ❌'}`);
      return newMode;
    });
  };

  useEffect(() => {
    if (debugMode) {
      console.log("=== DIAGNÓSTICO DETALHADO ===");
      console.log("Total de clientes:", filteredClients?.length || 0);
      console.log("Clientes filtrados por nome:", filteredByName.length);
      console.log("Clientes finais:", finalFilteredClients.length);

      // Log específico para Sorrifácil
      const sorrifacilClients = finalFilteredClients.filter(c => c.company_name === "Sorrifácil");
      console.log("Sorrifácil encontrado:", sorrifacilClients.length);
      
      sorrifacilClients.forEach(client => {
        console.log("Detalhes do Sorrifácil:", {
          id: client.id,
          contas: client.meta_accounts?.map(account => ({
            id: account.id,
            nome: account.account_name,
            isPrimary: account.is_primary,
            status: account.status
          }))
        });
      });
    }
  }, [debugMode, filteredClients, finalFilteredClients]);
  
  // Log para verificar renderização de clientes com contas secundárias
  console.log("=== RENDERIZAÇÃO DO METADASHBOARDCARD ===");
  console.log("Total de clientes filtrados:", finalFilteredClients.length);
  
  const clientesComContasSecundarias = finalFilteredClients.filter(c => 
    c.meta_accounts && Array.isArray(c.meta_accounts) && c.meta_accounts.length > 0
  );
  
  console.log("Clientes com contas secundárias:", clientesComContasSecundarias.length);
  
  // Log específico para Sorrifácil sempre
  const sorrifacil = finalFilteredClients.find(c => c.company_name === "Sorrifácil");
  if (sorrifacil) {
    console.log("SORRIFÁCIL ENCONTRADO NA LISTA FINAL:", {
      id: sorrifacil.id,
      contas: Array.isArray(sorrifacil.meta_accounts) ? sorrifacil.meta_accounts.map(a => ({
        id: a.id,
        account_id: a.account_id,
        nome: a.account_name,
        isPrimary: a.is_primary,
        status: a.status
      })) : 'Sem contas',
      totalContas: Array.isArray(sorrifacil.meta_accounts) ? sorrifacil.meta_accounts.length : 0
    });
  } else {
    console.log("SORRIFÁCIL NÃO ENCONTRADO NA LISTA FINAL");
  }

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
                  if (client.meta_accounts && Array.isArray(client.meta_accounts) && client.meta_accounts.length > 0) {
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
                    
                    // Importante: não usar filter aqui, apenas mapear todas as contas e depois filtrar resultados vazios
                    return client.meta_accounts.map((account, index) => {
                      const processingKey = getProcessingKey(client.id, account.id);
                      
                      console.log(`TENTATIVA DE RENDERIZAR CARD #${index+1} PARA [${client.company_name}]:`, {
                        account_id: account.id,
                        account_name: account.account_name,
                        account_status: account.status,
                        processingKey: processingKey,
                        isProcessing: processingClients.includes(processingKey)
                      });
                      
                      // Renderizar card mesmo sem verificar se a conta está ativa
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
