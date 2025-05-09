
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
  const { toast } = useToast();

  // Função para revisar um único cliente
  const reviewClient = async (clientId: string, metaAccountId?: string) => {
    const accountKey = `${clientId}-${metaAccountId || "default"}`;
    
    try {
      setProcessingAccounts((prev) => ({ ...prev, [accountKey]: true }));
      setProcessingIds((prev) => [...prev, clientId]);
      setLastError(null);

      console.log(`Iniciando revisão para cliente ${clientId}${metaAccountId ? ` (conta ${metaAccountId})` : ''}`);
      
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
        payload["metaAccountId"] = metaAccountId;
      }

      // Chamar função Edge apropriada para a plataforma
      const functionName = platform === "meta" ? "daily-meta-review" : "daily-google-review";
      
      console.log(`Enviando requisição para função Edge ${functionName}`);
      
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
      
      toast({
        title: "Revisão concluída",
        description: `Cliente ${clientId} revisado com sucesso`,
      });
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      setLastError(errorMessage);
      console.error(`Erro ao revisar cliente ${clientId}:`, error);
      
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

  // Função para verificar se um cliente/conta está sendo processado
  const isProcessingAccount = (clientId: string, accountId?: string) => {
    const key = `${clientId}-${accountId || "default"}`;
    return !!processingAccounts[key];
  };

  // Função para revisar todos os clientes em lote
  const reviewAllClients = async (clients: any[], metaAccountsData?: MetaAccount[]) => {
    try {
      setIsProcessing(true);
      setLastError(null);
      
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
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        toast({
          title: "Revisão em lote concluída",
          description: `${successCount} de ${uniqueClientsWithAccounts.size} contas processadas com sucesso${failureCount > 0 ? `, ${failureCount} falhas` : ''}`,
          variant: successCount === uniqueClientsWithAccounts.size ? "default" : "destructive",
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
        
        for (const client of clients) {
          if (!client.id) continue;
          
          const result = await reviewClient(client.id, client.meta_account_id);
          if (result) {
            successCount++;
          } else {
            failureCount++;
          }
          
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        toast({
          title: "Revisão em lote concluída",
          description: `${successCount} de ${clients.length} clientes processados com sucesso${failureCount > 0 ? `, ${failureCount} falhas` : ''}`,
          variant: successCount === clients.length ? "default" : "destructive",
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

  return {
    reviewClient,
    reviewAllClients,
    isProcessing,
    isProcessingAccount,
    processingIds,
    lastError,
    clearError: () => setLastError(null)
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
