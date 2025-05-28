
import { supabase } from "@/lib/supabase";
import axios from "axios";
import { toast } from "@/hooks/use-toast";
import { MetaAccount } from "../types/reviewTypes";

export const reviewClient = async (clientId: string, accountId?: string) => {
  try {
    console.log(`[reviewService] Iniciando revisão para cliente ${clientId}${accountId ? ` com conta Meta ${accountId}` : ''}`);

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

      if (metaError) {
        console.error(`[reviewService] Erro ao buscar conta Meta ${accountId}:`, metaError);
        throw metaError;
      }

      if (metaAccount) {
        metaAccountName = metaAccount.account_name;
        metaBudgetAmount = metaAccount.budget_amount;
        console.log(`[reviewService] Detalhes da conta Meta encontrados: ${metaAccountName}, orçamento: ${metaBudgetAmount}`);
      } else {
        console.log(`[reviewService] Nenhum detalhe encontrado para conta Meta ${accountId} do cliente ${clientId}`);
      }
    }

    const reviewDate = new Date().toISOString().split('T')[0];
    
    interface ReviewPayload {
      clientId: string;
      metaAccountId?: string;
      reviewDate: string;
      metaAccountName?: string;
      metaBudgetAmount?: number;
      fetchRealData?: boolean;
    }
    
    const payload: ReviewPayload = {
      clientId,
      metaAccountId: accountId,
      reviewDate,
      fetchRealData: true // Sempre tentar buscar dados reais
    };
    
    if (metaAccountName) {
      payload.metaAccountName = metaAccountName;
    }
    
    if (metaBudgetAmount !== undefined) {
      payload.metaBudgetAmount = metaBudgetAmount;
    }

    console.log("[reviewService] Enviando payload para função Edge:", {
      ...payload,
      accessToken: "***REDACTED***" // Não logar tokens
    });
    
    const url = `${window.location.origin}/api/daily-meta-review`;
    
    try {
      const response = await axios.post(url, payload);
      console.log("[reviewService] Resposta da função Edge:", {
        success: response.data?.success,
        reviewId: response.data?.reviewId,
        dataSource: response.data?.dataSource,
        totalSpent: response.data?.totalSpent,
        idealDailyBudget: response.data?.idealDailyBudget
      });
      
      // Verificar se a resposta contém um erro
      if (response.data && response.data.error) {
        throw new Error(`Erro da função Edge: ${response.data.error}`);
      }
      
      // Verificar se temos o ID da revisão na resposta
      if (response.data && response.data.reviewId) {
        console.log(`[reviewService] Revisão criada/atualizada com sucesso. ID: ${response.data.reviewId}`);
      } else {
        console.warn("[reviewService] Resposta da função Edge não contém reviewId:", response.data);
      }
      
      return response.data;
    } catch (axiosError: any) {
      console.error("[reviewService] Erro na requisição axios:", axiosError);
      
      // Detalhamento do erro para diagnóstico
      if (axiosError.response) {
        console.error("[reviewService] Dados da resposta de erro:", axiosError.response.data);
        console.error("[reviewService] Status do erro:", axiosError.response.status);
      } else if (axiosError.request) {
        console.error("[reviewService] Requisição feita mas sem resposta:", axiosError.request);
      } else {
        console.error("[reviewService] Erro ao configurar a requisição:", axiosError.message);
      }
      
      throw axiosError;
    }
  } catch (error: any) {
    console.error("[reviewService] Erro ao revisar cliente:", error);
    throw error;
  }
};

export const reviewAllClients = async (clients: any[], onSuccess: () => void, metaAccounts?: MetaAccount[]) => {
  // Se temos contas Meta definidas, vamos analisar cada conta separadamente
  if (metaAccounts && metaAccounts.length > 0) {
    console.log(`[reviewService] Revisando ${metaAccounts.length} contas Meta separadamente`);
    
    const successfulReviews: string[] = [];
    const failedReviews: string[] = [];
    
    // Para cada conta Meta, iniciar uma revisão
    for (const account of metaAccounts) {
      if (!account.client_id || !account.account_id) {
        console.warn("[reviewService] Conta Meta sem client_id ou account_id válidos:", account);
        failedReviews.push(`Conta inválida: ${account.id || 'desconhecida'}`);
        continue;
      }
      
      try {
        console.log(`[reviewService] Revisando cliente ${account.client_id} com conta Meta ${account.account_id} (${account.account_name || 'sem nome'})`);
        await reviewClient(account.client_id, account.account_id);
        successfulReviews.push(`${account.account_name || account.account_id}`);
      } catch (error) {
        console.error(`[reviewService] Erro ao revisar cliente ${account.client_id} com conta ${account.account_id}:`, error);
        failedReviews.push(`${account.account_name || account.account_id}`);
      }
    }
    
    // Detalhes sobre o resultado da operação
    console.log(`[reviewService] Revisões concluídas: ${successfulReviews.length} contas, falhas: ${failedReviews.length}`);
    if (failedReviews.length > 0) {
      console.log("[reviewService] Contas com falhas:", failedReviews);
    }
    
    toast({
      title: "Revisão em massa concluída",
      description: `${successfulReviews.length} contas revisadas com sucesso${failedReviews.length > 0 ? `, ${failedReviews.length} falhas` : ''}.`,
      duration: 5000,
    });
  } else {
    // Comportamento original: revisar apenas o cliente sem especificar conta
    console.log(`[reviewService] Revisando ${clients.length} clientes sem especificar contas Meta`);
    
    const successfulReviews: string[] = [];
    const failedReviews: string[] = [];
    
    for (const client of clients) {
      try {
        await reviewClient(client.id);
        successfulReviews.push(client.company_name);
      } catch (error) {
        console.error(`[reviewService] Erro ao revisar cliente ${client.id}:`, error);
        failedReviews.push(client.company_name);
      }
    }
    
    toast({
      title: "Revisão em massa concluída",
      description: `${successfulReviews.length} clientes revisados com sucesso${failedReviews.length > 0 ? `, ${failedReviews.length} falhas` : ''}.`,
      duration: 5000,
    });
  }

  onSuccess();
};
