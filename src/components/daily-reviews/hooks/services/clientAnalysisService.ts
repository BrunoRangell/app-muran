
import axios from 'axios';
import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';

export const reviewClient = async (clientId: string, metaAccountId?: string) => {
  try {
    logger.info('META_ADS', `Starting review for client ${clientId}`, { metaAccountId });

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
    
    if (metaAccountName) {
      payload.metaAccountName = metaAccountName;
    }
    
    if (metaBudgetAmount !== undefined) {
      payload.metaBudgetAmount = metaBudgetAmount;
    }

    const url = `${window.location.origin}/api/daily-meta-review`;
    const response = await axios.post(url, payload);

    logger.info('META_ADS', 'Client review completed successfully', { clientId, responseData: response.data });
    return response.data;
  } catch (error) {
    logger.error('META_ADS', 'Failed to review client', error);
    throw error;
  }
};
