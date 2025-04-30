
import { supabase } from "@/lib/supabase";
import axios from "axios";
import { toast } from "@/hooks/use-toast";
import { MetaAccount } from "../types/reviewTypes";

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
        console.log(`Detalhes da conta Meta encontrados: ${metaAccountName}, orçamento: ${metaBudgetAmount}`);
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

    console.log("Enviando payload para função Edge:", payload);
    const url = `${window.location.origin}/api/daily-meta-review`;
    const response = await axios.post(url, payload);

    console.log("Resposta da função Edge:", response.data);
    return response.data;
  } catch (error) {
    console.error("Erro ao revisar cliente:", error);
    throw error;
  }
};

export const reviewAllClients = async (clients: any[], onSuccess: () => void, metaAccounts?: MetaAccount[]) => {
  // Se temos contas Meta definidas, vamos analisar cada conta separadamente
  if (metaAccounts && metaAccounts.length > 0) {
    console.log(`Revisando ${metaAccounts.length} contas Meta separadamente`);
    
    // Para cada conta Meta, iniciar uma revisão
    for (const account of metaAccounts) {
      if (!account.client_id || !account.account_id) {
        console.warn("Conta Meta sem client_id ou account_id válidos:", account);
        continue;
      }
      
      try {
        console.log(`Revisando cliente ${account.client_id} com conta Meta ${account.account_id}`);
        await reviewClient(account.client_id, account.account_id);
      } catch (error) {
        console.error(`Erro ao revisar cliente ${account.client_id} com conta ${account.account_id}:`, error);
      }
    }
  } else {
    // Comportamento original: revisar apenas o cliente sem especificar conta
    for (const client of clients) {
      try {
        await reviewClient(client.id);
      } catch (error) {
        console.error(`Erro ao revisar cliente ${client.id}:`, error);
      }
    }
  }
  
  toast({
    title: "Revisão em massa concluída",
    description: `Foram revisados ${metaAccounts?.length || clients.length} clientes/contas.`,
    duration: 5000,
  });

  onSuccess();
};
