
import axios from 'axios';
import { supabase } from '@/lib/supabase';
import { callEdgeFunction } from '../useEdgeFunction';

export const reviewClient = async (clientId: string, metaAccountId?: string) => {
  try {
    console.log(`Iniciando revisão para cliente ${clientId}${metaAccountId ? ` com conta Meta ${metaAccountId}` : ''}`);

    // Se for fornecido um ID de conta Meta específica, buscar os detalhes dessa conta
    let metaAccountName: string | undefined;
    let metaBudgetAmount: number | undefined;

    if (metaAccountId) {
      const { data: metaAccount, error: metaError } = await supabase
        .from('client_meta_accounts')
        .select('account_name, budget_amount')
        .eq('client_id', clientId)
        .eq('account_id', metaAccountId)
        .maybeSingle();

      if (metaError) throw metaError;

      if (metaAccount) {
        metaAccountName = metaAccount.account_name;
        metaBudgetAmount = metaAccount.budget_amount;
      }
    }

    // Montar payload da requisição com as informações da conta específica, se fornecida
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
      metaAccountId,
      reviewDate
    };
    
    // Adicionar informações opcionais ao payload, se disponíveis
    if (metaAccountName) {
      payload.metaAccountName = metaAccountName;
    }
    
    if (metaBudgetAmount !== undefined) {
      payload.metaBudgetAmount = metaBudgetAmount;
    }

    // Fazer chamada para a edge function
    const url = `${window.location.origin}/api/daily-meta-review`;
    const response = await axios.post(url, payload);

    console.log("Resposta da função Edge:", response.data);
    return response.data;
  } catch (error) {
    console.error("Erro ao revisar cliente:", error);
    throw error;
  }
};
