
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
  const { toast } = useToast();

  // Função para revisar um único cliente
  const reviewClient = async (clientId: string, metaAccountId?: string) => {
    const accountKey = `${clientId}-${metaAccountId || "default"}`;
    
    try {
      setProcessingAccounts((prev) => ({ ...prev, [accountKey]: true }));
      setProcessingIds((prev) => [...prev, clientId]);

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
        reviewDate: new Date().toISOString().split("T")[0]
      };

      // Adicionar accountId específico se fornecido
      if (metaAccountId) {
        payload["metaAccountId"] = metaAccountId;
      }

      // Verificar se há orçamento personalizado ativo para este cliente/conta
      const { data: customBudget, error: customBudgetError } = await supabase
        .from("custom_budgets")
        .select("*")
        .eq("client_id", clientId)
        .eq("platform", platform)
        .eq("is_active", true)
        .lte("start_date", new Date().toISOString().split("T")[0])
        .gte("end_date", new Date().toISOString().split("T")[0])
        .order("created_at", { ascending: false })
        .maybeSingle();

      // Se encontrou um orçamento personalizado, adicionar ao payload
      if (customBudget && !customBudgetError) {
        payload["using_custom_budget"] = true;
        payload["custom_budget_id"] = customBudget.id;
        payload["custom_budget_amount"] = customBudget.budget_amount;
        
        console.log(`Usando orçamento personalizado: ${customBudget.budget_amount} para cliente ${clientId}`);
      }

      // Chamar função Edge apropriada para a plataforma
      const functionName = platform === "meta" ? "daily-meta-review" : "daily-google-review";
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload
      });

      if (error) {
        throw new Error(`Erro na função Edge: ${error.message}`);
      }

      console.log(`Revisão concluída com sucesso:`, data);
      return true;
    } catch (error) {
      console.error(`Erro ao revisar cliente ${clientId}:`, error);
      toast({
        title: "Erro na revisão",
        description: error.message || "Ocorreu um erro ao processar a revisão",
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
  const reviewAllClients = async (clients: any[]) => {
    try {
      setIsProcessing(true);
      
      const uniqueClientsWithAccounts = new Map();
      
      // Organizar clientes por ID e contas
      clients.forEach(client => {
        const clientId = client.id;
        let accountId = null;
        
        // Determinar qual ID de conta usar com base na plataforma
        if (platform === "meta" && client.meta_account_id) {
          accountId = client.meta_account_id;
        } else if (platform === "google" && client.google_account_id) {
          accountId = client.google_account_id;
        }
        
        if (accountId) {
          // Se o cliente tem uma conta específica
          const key = `${clientId}-${accountId}`;
          uniqueClientsWithAccounts.set(key, {
            clientId,
            accountId,
            customBudget: client.custom_budget
          });
        } else {
          // Cliente sem conta específica
          const key = `${clientId}-default`;
          uniqueClientsWithAccounts.set(key, { 
            clientId,
            customBudget: client.custom_budget
          });
        }
      });
      
      console.log(`Processando ${uniqueClientsWithAccounts.size} clientes/contas em lote`);
      
      // Processamento sequencial para evitar sobrecarga
      const results = [];
      for (const client of uniqueClientsWithAccounts.values()) {
        const result = await reviewClient(client.clientId, client.accountId);
        results.push(result);
        
        // Pequeno delay entre requisições
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      const successCount = results.filter(Boolean).length;
      
      toast({
        title: "Revisão em lote concluída",
        description: `${successCount} de ${uniqueClientsWithAccounts.size} contas processadas com sucesso`,
        variant: successCount === uniqueClientsWithAccounts.size ? "default" : "destructive",
      });
      
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error("Erro no processamento em lote:", error);
      toast({
        title: "Erro no processamento em lote",
        description: error.message || "Ocorreu um erro ao processar a revisão em lote",
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
  };
}
