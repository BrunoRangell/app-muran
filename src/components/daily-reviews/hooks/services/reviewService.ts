
import { supabase } from "@/lib/supabase";
import axios from "axios";
import { toast } from "@/hooks/use-toast";

export const reviewClient = async (clientId: string, accountId?: string) => {
  try {
    console.log(`Iniciando revisão para cliente ${clientId}${accountId ? ` com conta Meta ${accountId}` : ''}`);

    // Se fornecido um ID de conta Meta específica, buscar detalhes
    let metaAccountName: string | undefined;
    let metaBudgetAmount: number | undefined;

    if (accountId) {
      const { data: metaAccount, error: metaError } = await supabase
        .from('client_meta_accounts')
        .select('account_name, budget_amount')
        .eq('client_id', clientId)
        .eq('account_id', accountId)
        .maybeSingle();

      if (metaError) throw metaError;

      if (metaAccount) {
        metaAccountName = metaAccount.account_name;
        metaBudgetAmount = metaAccount.budget_amount;
      }
    }

    const reviewDate = new Date().toISOString().split('T')[0];
    
    interface ReviewPayload {
      clientId: string;
      metaAccountId?: string;
      reviewDate: string;
      metaAccountName?: string;
      metaBudgetAmount?: number;
    }
    
    const payload: ReviewPayload = {
      clientId,
      metaAccountId: accountId,
      reviewDate
    };
    
    if (metaAccountName) {
      payload.metaAccountName = metaAccountName;
    }
    
    if (metaBudgetAmount !== undefined) {
      payload.metaBudgetAmount = metaBudgetAmount;
    }

    const url = `${window.location.origin}/api/daily-meta-review`;
    const response = await axios.post(url, payload);

    console.log("Resposta da função Edge:", response.data);
    return response.data;
  } catch (error) {
    console.error("Erro ao revisar cliente:", error);
    throw error;
  }
};

export const reviewAllClients = async (clients: any[], onSuccess: () => void) => {
  for (const client of clients) {
    try {
      await reviewClient(client.id);
    } catch (error) {
      console.error(`Erro ao revisar cliente ${client.id}:`, error);
    }
  }
  
  toast({
    title: "Revisão em massa concluída",
    description: `Foram revisados ${clients.length} clientes.`,
    duration: 5000,
  });

  onSuccess();
};
