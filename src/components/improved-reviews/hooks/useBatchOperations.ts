
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface BatchOperationsProps {
  platform: "meta" | "google";
  onComplete?: () => void;
}

export function useBatchOperations({ platform, onComplete }: BatchOperationsProps = { platform: "meta" }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingAccounts, setProcessingAccounts] = useState<Record<string, boolean>>({});
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);
  const [successfulReviews, setSuccessfulReviews] = useState<string[]>([]);
  const [failedReviews, setFailedReviews] = useState<FailedReviewInfo[]>([]);
  const { toast } = useToast();

  // Configurações para retry de operações
  const MAX_RETRY_ATTEMPTS = 2; // Máximo de tentativas de retry
  const RETRY_DELAY = 1000; // Delay entre retries em ms

  // Função para aguardar um tempo específico (para retry)
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Função para revisar um único cliente
  const reviewClient = async (clientId: string, metaAccountId?: string, retryAttempt = 0) => {
    const accountKey = `${clientId}-${metaAccountId || "default"}`;
    
    try {
      setProcessingAccounts((prev) => ({ ...prev, [accountKey]: true }));
      setProcessingIds((prev) => [...prev, clientId]);
      
      // Limpar erro anterior ao tentar novamente
      if (retryAttempt === 0) {
        setLastError(null);
      }

      console.log(`Iniciando revisão para cliente ${clientId}${metaAccountId ? ` (conta ${metaAccountId})` : ''} - Tentativa ${retryAttempt + 1}`);
      
      // Obter token do Meta Ads
      const { data: tokenData, error: tokenError } = await supabase
        .from("api_tokens")
        .select("value")
        .eq("name", "meta_access_token")
        .maybeSingle();
      
      if (tokenError) {
        throw new Error("Erro ao buscar token Meta Ads: " + tokenError.message);
      }
      
      if (!tokenData?.value) {
        throw new Error("Token Meta Ads não configurado");
      }

      // Construir payload para função Edge
      const payload = {
        clientId,
        accessToken: tokenData.value,
        reviewDate: new Date().toISOString().split("T")[0],
        _timestamp: Date.now() // Evitar cache
      };

      // Adicionar accountId específico se fornecido
      if (metaAccountId) {
        payload["accountId"] = metaAccountId;
      }

      // Chamar função Edge apropriada para a plataforma
      const functionName = platform === "meta" ? "daily-meta-review" : "daily-google-review";
      
      console.log(`Enviando requisição para função Edge ${functionName}`);
      
      try {
        const { data, error } = await supabase.functions.invoke(functionName, {
          body: payload
        });

        if (error) {
          console.error(`Erro na função Edge ${functionName}:`, error);
          throw new Error(`Erro na função Edge: ${error.message || "Erro desconhecido"}`);
        }

        if (!data) {
          throw new Error("A função Edge retornou dados vazios");
        }
        
        if (data.error) {
          throw new Error(`Erro no processamento: ${data.error}`);
        }

        console.log(`Revisão concluída com sucesso:`, data);
        
        // Adicionar à lista de revisões bem-sucedidas
        setSuccessfulReviews(prev => [...prev, metaAccountId || clientId]);
        
        toast({
          title: "Revisão concluída",
          description: `Cliente ${clientId}${metaAccountId ? ` (conta ${metaAccountId})` : ''} revisado com sucesso`,
        });
        
        return true;
      } catch (apiError: any) {
        // Verificar se o erro é elegível para retry
        const isRetryable = 
          retryAttempt < MAX_RETRY_ATTEMPTS && 
          (apiError.message?.includes("timeout") || 
           apiError.message?.includes("network") || 
           apiError.message?.includes("fetch"));
        
        if (isRetryable) {
          console.log(`Erro retryable, tentando novamente em ${RETRY_DELAY}ms...`);
          await delay(RETRY_DELAY);
          return reviewClient(clientId, metaAccountId, retryAttempt + 1);
        }
        
        // Se chegamos aqui, é porque o erro não é retryable ou excedemos o limite de tentativas
        throw apiError;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      setLastError(errorMessage);
      console.error(`Erro ao revisar cliente ${clientId}:`, error);
      
      // Capturar detalhes do erro
      const errorDetails = extractErrorDetails(error, metaAccountId || clientId);
      
      // Adicionar à lista de revisões com falha
      setFailedReviews(prev => [...prev, {
        id: metaAccountId || clientId,
        name: metaAccountId || clientId,
        error: errorMessage,
        details: errorDetails
      }]);
      
      toast({
        title: "Erro na revisão",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setProcessingAccounts((prev) => ({ ...prev, [accountKey]: false }));
      setProcessingIds((prev) => prev.filter(id => id !== clientId));
    }
  };

  // Extrair detalhes do erro para exibição e debugging
  const extractErrorDetails = (error: any, accountId: string): ErrorDetails => {
    let errorType = "unknown";
    let suggestion = "";
    
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    if (errorMsg.includes("does not exist") || errorMsg.includes("ID") && errorMsg.includes("não encontrada")) {
      errorType = "invalid_account";
      suggestion = `A conta ${accountId} parece não existir ou estar incorreta. Verifique o ID da conta.`;
    } else if (errorMsg.includes("permissions") || errorMsg.includes("permissão")) {
      errorType = "permission_denied";
      suggestion = `Sem permissão para acessar a conta ${accountId}. Verifique se o token tem as permissões corretas.`;
    } else if (errorMsg.includes("timeout") || errorMsg.includes("network") || errorMsg.includes("conectividade")) {
      errorType = "network";
      suggestion = "Problema de rede ou timeout. Tente novamente mais tarde.";
    } else if (errorMsg.includes("token")) {
      errorType = "token_issue";
      suggestion = "Problema com o token de acesso. Verifique se o token é válido e não expirou.";
    }
    
    return {
      type: errorType,
      message: errorMsg,
      suggestion
    };
  };

  // Função para verificar se um cliente/conta está sendo processado
  const isProcessingAccount = (clientId: string, accountId?: string) => {
    const key = `${clientId}-${accountId || "default"}`;
    return !!processingAccounts[key];
  };

  // Função para revisar todos os clientes em lote
  const reviewAllClients = async (clients: any[], metaAccountsData?: MetaAccount[]) => {
    try {
      // Resetar estado de processamento
      setIsProcessing(true);
      setLastError(null);
      setSuccessfulReviews([]);
      setFailedReviews([]);
      
      // Se temos contas Meta específicas, revisá-las individualmente
      if (metaAccountsData && metaAccountsData.length > 0) {
        const uniqueClientsWithAccounts = new Map();
        
        // Organizar clientes por ID e contas Meta
        metaAccountsData.forEach(account => {
          if (account.client_id && account.account_id) {
            const key = `${account.client_id}-${account.account_id}`;
            uniqueClientsWithAccounts.set(key, {
              clientId: account.client_id,
              metaAccountId: account.account_id,
              accountName: account.account_name || account.account_id
            });
          }
        });
        
        console.log(`Processando ${uniqueClientsWithAccounts.size} contas Meta em lote`);
        
        if (uniqueClientsWithAccounts.size === 0) {
          toast({
            title: "Nenhuma conta para revisar",
            description: "Não foram encontradas contas Meta para revisar",
            variant: "default",
          });
          return;
        }
        
        let successCount = 0;
        let failureCount = 0;
        
        // Processamento sequencial para evitar sobrecarga
        for (const client of uniqueClientsWithAccounts.values()) {
          const result = await reviewClient(client.clientId, client.metaAccountId);
          if (result) {
            successCount++;
          } else {
            failureCount++;
          }
          
          // Pequeno delay entre requisições
          await delay(300);
        }
        
        // Resumo do processamento em lote
        const summary = `${successCount} de ${uniqueClientsWithAccounts.size} contas processadas com sucesso${failureCount > 0 ? `, ${failureCount} falhas` : ''}`;
        
        console.log("Resumo do processamento:", summary);
        console.log("Contas com sucesso:", successfulReviews);
        
        if (failedReviews.length > 0) {
          console.log("Detalhes das falhas:", failedReviews);
        }
        
        toast({
          title: "Revisão em lote concluída",
          description: summary,
          variant: successCount === uniqueClientsWithAccounts.size ? "default" : "destructive",
          duration: 6000,
        });
      } else {
        // Revisão baseada apenas nos clientes (sem contas específicas)
        console.log(`Processando ${clients.length} clientes em lote`);
        
        if (clients.length === 0) {
          toast({
            title: "Nenhum cliente para revisar",
            description: "Não foram encontrados clientes para revisar",
            variant: "default",
          });
          return;
        }
        
        let successCount = 0;
        let failureCount = 0;
        
        // Filtrar clientes sem conta Meta válida
        const validClients = clients.filter(client => 
          client && client.id && (client.meta_account_id || platform === "google"));
        
        if (validClients.length === 0) {
          toast({
            title: "Nenhum cliente válido para revisar",
            description: `Não foram encontrados clientes com contas ${platform === "meta" ? "Meta" : "Google"} configuradas`,
            variant: "destructive",
          });
          return;
        }
        
        for (const client of validClients) {
          if (!client.id) continue;
          
          const result = await reviewClient(client.id, client.meta_account_id);
          if (result) {
            successCount++;
          } else {
            failureCount++;
          }
          
          await delay(300);
        }
        
        // Resumo do processamento em lote
        const summary = `${successCount} de ${validClients.length} clientes processados com sucesso${failureCount > 0 ? `, ${failureCount} falhas` : ''}`;
        
        console.log("Resumo do processamento:", summary);
        
        toast({
          title: "Revisão em lote concluída",
          description: summary,
          variant: successCount === validClients.length ? "default" : "destructive",
          duration: 6000,
        });
      }
      
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      setLastError(errorMessage);
      console.error("Erro no processamento em lote:", error);
      
      toast({
        title: "Erro no processamento em lote",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Resetar estado de processamento
  const resetProcessingState = () => {
    setLastError(null);
    setFailedReviews([]);
    setSuccessfulReviews([]);
  };

  return {
    reviewClient,
    reviewAllClients,
    isProcessing,
    isProcessingAccount,
    processingIds,
    lastError,
    successfulReviews,
    failedReviews,
    clearError: resetProcessingState,
    resetProcessingState
  };
}

// Interface para MetaAccount
interface MetaAccount {
  id: string;
  client_id: string;
  account_id: string;
  account_name?: string;
  budget_amount?: number;
  is_primary?: boolean;
  status?: string;
}

// Interfaces para tratamento de erros
interface ErrorDetails {
  type: string;
  message: string;
  suggestion: string;
}

interface FailedReviewInfo {
  id: string;
  name: string;
  error: string;
  details: ErrorDetails;
}
