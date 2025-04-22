
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useClientAnalysis } from "./useClientAnalysis";
import { useQueryClient } from "@tanstack/react-query";
import { fetchClientsWithReviews } from "./services/clientReviewService";

// Definindo a interface para os parâmetros da análise
interface AnalysisParams {
  clientId: string;
  accountId?: string | null;
}

export const useClientReviewAnalysis = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [filteredClients, setFilteredClients] = useState([]);
  const [processingClients, setProcessingClients] = useState([]);
  const queryClient = useQueryClient();

  // Importamos o hook useClientAnalysis para analisar o cliente
  const { analyzeMutation } = useClientAnalysis((data: AnalysisParams) => {
    toast({
      title: "Análise concluída",
      description: `Análise do cliente atualizada com sucesso.`,
    });
    
    // Remover o cliente da lista de processamento
    const processingKey = data.accountId ? `${data.clientId}-${data.accountId}` : data.clientId;
    setProcessingClients(prev => prev.filter(id => id !== processingKey));
    
    // Invalidar consultas para forçar atualização
    queryClient.invalidateQueries({ queryKey: ["client-detail", data.clientId] });
    queryClient.invalidateQueries({ queryKey: ["latest-review", data.clientId] });
    queryClient.invalidateQueries({ queryKey: ["review-history", data.clientId] });
    
    // Recarregar a lista de clientes
    loadClients();
  });
  
  // Carregar os clientes do Supabase
  const loadClients = async () => {
    setIsLoading(true);
    try {
      console.log("Iniciando carregamento de clientes com contas secundárias...");
      const result = await fetchClientsWithReviews();
      console.log("Dados brutos recebidos:", result);
      
      // Garantir que todos os clientes tenham meta_accounts definido como array
      const clientsData = result.clientsData.map(client => {
        // Log detalhado para cada cliente
        console.log(`DIAGNÓSTICO DETALHADO [${client.company_name}]:`, {
          id: client.id,
          meta_accounts_antes: client.meta_accounts,
          é_array: Array.isArray(client.meta_accounts),
          comprimento: client.meta_accounts ? client.meta_accounts.length : 0
        });
        
        // Garantir que meta_accounts seja sempre um array
        const processedClient = {
          ...client,
          meta_accounts: Array.isArray(client.meta_accounts) ? client.meta_accounts : []
        };
        
        // Log após processamento
        console.log(`DIAGNÓSTICO APÓS PROCESSAMENTO [${processedClient.company_name}]:`, {
          meta_accounts_depois: processedClient.meta_accounts,
          é_array_depois: Array.isArray(processedClient.meta_accounts),
          comprimento_depois: processedClient.meta_accounts.length
        });
        
        return processedClient;
      });
      
      console.log("Clientes processados com meta_accounts:", clientsData.length);
      
      // Verificar clientes com contas secundárias para depuração
      const clientesComContas = clientsData.filter(c => c.meta_accounts && c.meta_accounts.length > 0);
      console.log(`Total de clientes com contas secundárias: ${clientesComContas.length}`);
      
      clientesComContas.forEach(client => {
        console.log(`VERIFICAÇÃO DE CONTAS [${client.company_name}]:`, {
          id: client.id,
          total_contas: client.meta_accounts.length,
          contas: client.meta_accounts.map(acc => ({
            id: acc.id,
            account_id: acc.account_id,
            nome: acc.account_name,
            isPrimary: acc.is_primary
          }))
        });
      });
      
      setFilteredClients(clientsData);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      toast({
        title: "Erro ao carregar clientes",
        description: "Não foi possível carregar a lista de clientes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Função para analisar um cliente
  const reviewClient = (clientId: string, accountId?: string) => {
    // Criar uma chave única para o par cliente/conta
    const processingKey = accountId ? `${clientId}-${accountId}` : clientId;
    
    // Evitar análises simultâneas do mesmo cliente/conta
    if (processingClients.includes(processingKey)) {
      toast({
        title: "Análise em andamento",
        description: "Este cliente já está sendo analisado.",
      });
      return;
    }
    
    // Adicionar o cliente à lista de processamento
    setProcessingClients(prev => [...prev, processingKey]);
    console.log(`Iniciando análise para cliente: ${clientId}${accountId ? ` (conta: ${accountId})` : ''}`);
    
    // Iniciar análise
    analyzeMutation.mutate({ clientId, accountId }, {
      onError: (error) => {
        console.error("Erro na análise do cliente:", error);
        setProcessingClients(prev => prev.filter(id => id !== processingKey));
        
        toast({
          title: "Erro na análise",
          description: error instanceof Error ? error.message : "Erro desconhecido",
          variant: "destructive",
        });
      }
    });
  };
  
  // Função para analisar todos os clientes
  const reviewAllClients = async () => {
    console.log("Iniciando análise de todos os clientes");
    
    try {
      // Obter a lista atualizada de clientes
      const clientsToProcess = filteredClients.filter(client => client.meta_account_id);
      
      if (clientsToProcess.length === 0) {
        toast({
          title: "Nenhum cliente para analisar",
          description: "Não há clientes com Meta Ads configurado.",
        });
        return;
      }
      
      // Lista para armazenar todos os pares cliente/conta a processar
      const processingItems = [];
      
      // Preparar lista de todos os clientes e suas contas para processar
      for (const client of clientsToProcess) {
        if (client.meta_accounts && client.meta_accounts.length > 0) {
          // Cliente com contas múltiplas - adicionar cada conta
          client.meta_accounts.forEach(account => {
            processingItems.push({
              clientId: client.id,
              accountId: account.id,
              processingKey: `${client.id}-${account.id}`
            });
          });
        } else {
          // Cliente com conta única - usar a configuração principal
          processingItems.push({
            clientId: client.id,
            accountId: null,
            processingKey: client.id
          });
        }
      }
      
      console.log(`Total de itens para processar: ${processingItems.length}`);
      
      // Registrar todos os itens como em processamento
      setProcessingClients(prev => [
        ...prev,
        ...processingItems.map(item => item.processingKey)
      ]);
      
      // Iniciar análises em sequência para evitar sobrecarga
      for (const item of processingItems) {
        console.log(`Iniciando análise para: ${item.processingKey}`);
        
        try {
          // Usando Promise para poder aguardar cada análise
          await new Promise((resolve, reject) => {
            analyzeMutation.mutate({ 
              clientId: item.clientId, 
              accountId: item.accountId 
            }, {
              onSuccess: () => resolve(null),
              onError: (error) => {
                console.error(`Erro na análise de ${item.processingKey}:`, error);
                resolve(null); // Continuar mesmo com erro
              }
            });
          });
          
          // Aguardar um curto intervalo entre as análises
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (err) {
          console.error(`Erro ao analisar ${item.processingKey}:`, err);
          // Continuar com o próximo cliente mesmo em caso de erro
        }
      }
      
      toast({
        title: "Análise em lote concluída",
        description: `Foram processados ${processingItems.length} itens.`,
      });
      
    } catch (error) {
      console.error("Erro ao processar análise em lote:", error);
      toast({
        title: "Erro na análise em lote",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao processar a análise em lote",
        variant: "destructive",
      });
    } finally {
      // Recarregar a lista de clientes após o processamento
      loadClients();
    }
  };
  
  // Carregar clientes ao montar o componente
  useEffect(() => {
    loadClients();
  }, []);
  
  return {
    filteredClients,
    isLoading,
    processingClients,
    reviewClient,
    reviewAllClients,
    isRefreshing: analyzeMutation.isPending,
    isAnalyzing: analyzeMutation.isPending,
    handleRefreshAnalysis: loadClients
  };
};
