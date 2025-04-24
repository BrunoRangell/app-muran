
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientAltCard } from "./ClientAltCard";
import { useClientReviewAnalysis } from "../hooks/useClientReviewAnalysis";
import { FilterOptions } from "./components/FilterOptions";
import { useState } from "react";
import { filterClientsByName, filterClientsByAdjustment } from "./utils/clientFiltering";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { MetaAccount } from "../hooks/types/accountTypes";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { RotateCw } from "lucide-react";

interface MetaDashboardCardProps {
  onViewClientDetails: (clientId: string) => void;
  onAnalyzeAll?: () => Promise<void>;
}

export const MetaDashboardCard = ({ onViewClientDetails, onAnalyzeAll }: MetaDashboardCardProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyAdjustments, setShowOnlyAdjustments] = useState(false);
  const { toast } = useToast();
  
  const { 
    filteredClients, 
    isLoading, 
    processingClients, 
    reviewClient,
    reviewAllClients 
  } = useClientReviewAnalysis();
  
  const filteredByName = filteredClients ? filterClientsByName(filteredClients, searchQuery) : [];
  const finalFilteredClients = filterClientsByAdjustment(filteredByName, showOnlyAdjustments);

  // Função que será chamada para análise em lote
  const handleAnalyzeAll = async () => {
    if (reviewAllClients) {
      await reviewAllClients();
    } else if (onAnalyzeAll) {
      await onAnalyzeAll();
    }
  };
  
  // Consulta para buscar TODAS as contas Meta de clientes ativos, incluindo contas primárias e secundárias
  const { data: metaAccounts, isLoading: isLoadingAccounts, refetch: refetchMetaAccounts } = useQuery({
    queryKey: ['meta-accounts-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_meta_accounts')
        .select('*')
        .eq('status', 'active');
        
      if (error) {
        console.error("Erro ao buscar contas Meta:", error);
        toast({
          title: "Erro ao buscar contas Meta",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      console.log("Contas Meta recuperadas:", data?.length);
      return data as MetaAccount[];
    }
  });
  
  // Mapa para agrupar contas Meta por clientId para fácil acesso
  const clientAccountsMap = new Map();
  metaAccounts?.forEach(account => {
    if (!clientAccountsMap.has(account.client_id)) {
      clientAccountsMap.set(account.client_id, []);
    }
    clientAccountsMap.get(account.client_id).push(account);
  });

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
            onClick={() => refetchMetaAccounts()} 
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

        {isLoading || isLoadingAccounts ? (
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
                  // Obter as contas Meta do cliente do mapa que criamos
                  const clientAccounts = clientAccountsMap.get(client.id) || [];
                  
                  // Se o cliente não tem contas Meta cadastradas no novo sistema,
                  // usar o orçamento e ID da conta da configuração padrão do cliente
                  if (clientAccounts.length === 0) {
                    return (
                      <ClientAltCard
                        key={client.id}
                        client={client}
                        onReviewClient={reviewClient}
                        isProcessing={processingClients.includes(client.id)}
                      />
                    );
                  }
                  
                  // Renderizar um card para cada conta Meta do cliente
                  return clientAccounts.map((account) => (
                    <ClientAltCard
                      key={`${client.id}-${account.account_id}`}
                      client={client}
                      metaAccount={account}
                      onReviewClient={reviewClient}
                      isProcessing={processingClients.includes(client.id)}
                    />
                  ));
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center p-10">
            <p className="text-gray-500">Nenhum cliente encontrado</p>
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
