
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
  const { toast } = useToast();

  // Função para revisar um único cliente
  const reviewClient = async (clientId: string, metaAccountId?: string) => {
    const accountKey = `${clientId}-${metaAccountId || "default"}`;
    
    try {
      setProcessingAccounts((prev) => ({ ...prev, [accountKey]: true }));

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
      
      // Organizar clientes por ID e contas Meta
      clients.forEach(client => {
        const clientId = client.id;
        
        if (client.meta_account_id) {
          // Se o cliente tem uma conta Meta específica
          const key = `${clientId}-${client.meta_account_id}`;
          uniqueClientsWithAccounts.set(key, {
            clientId,
            metaAccountId: client.meta_account_id
          });
        } else {
          // Cliente sem conta específica
          const key = `${clientId}-default`;
          uniqueClientsWithAccounts.set(key, { clientId });
        }
      });
      
      console.log(`Processando ${uniqueClientsWithAccounts.size} clientes/contas em lote`);
      
      // Processamento sequencial para evitar sobrecarga
      const results = [];
      for (const client of uniqueClientsWithAccounts.values()) {
        const result = await reviewClient(client.clientId, client.metaAccountId);
        results.push(result);
        
        // Pequeno delay entre requisições
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      const successCount = results.filter(Boolean).length;
      
      toast({
        title: "Revisão em lote concluída",
        description: `${successCount} de ${uniqueClientsWithAccounts.size} contas processadas com sucesso`,
        variant: successCount === uniqueClientsWithAccounts.size ? "default" : "warning",
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
  };
}
