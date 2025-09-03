
import { supabase } from "@/integrations/supabase/client";

interface ReviewClientParams {
  clientId: string;
  accountId?: string;
  platform: "meta" | "google";
}

export const reviewClient = async ({ clientId, accountId, platform }: ReviewClientParams) => {
  console.log(`[unifiedReviewService] Iniciando revisão unificada para cliente ${clientId} (${platform})${accountId ? ` com conta ${accountId}` : ''}`);
  
  try {
    const payload = {
      platform,
      mode: 'single' as const,
      clientId,
      accountId,
      options: {
        updateCampaignHealth: true
      }
    };

    console.log(`[unifiedReviewService] Chamando unified-daily-review:`, payload);

    const { data, error } = await supabase.functions.invoke('unified-daily-review', {
      body: payload
    });

    if (error) {
      console.error(`[unifiedReviewService] Erro na função unificada:`, error);
      throw new Error(error.message || `Erro na revisão ${platform}`);
    }

    if (!data.success) {
      console.error(`[unifiedReviewService] Falha na revisão:`, data.error);
      throw new Error(data.error || `Falha na revisão ${platform}`);
    }

    console.log(`[unifiedReviewService] Revisão ${platform} concluída com sucesso para cliente ${clientId}`);
    return data;

  } catch (error) {
    console.error(`[unifiedReviewService] Erro geral na revisão ${platform}:`, error);
    throw error;
  }
};

export const reviewAllClients = async (
  clients: any[], 
  platform: "meta" | "google",
  onSuccess?: () => void
) => {
  console.log(`[unifiedReviewService] Iniciando revisão unificada em lote para ${clients.length} clientes ${platform}`);
  
  try {
    const payload = {
      platform,
      mode: 'batch' as const,
      clients: clients.map(client => ({
        id: client.id,
        company_name: client.company_name,
        meta_account_id: client.meta_account_id,
        google_account_id: client.google_account_id
      })),
      options: {
        updateCampaignHealth: true
      }
    };

    console.log(`[unifiedReviewService] Chamando unified-daily-review em batch:`, {
      platform,
      clientsCount: clients.length
    });

    const { data, error } = await supabase.functions.invoke('unified-daily-review', {
      body: payload
    });

    if (error) {
      console.error(`[unifiedReviewService] Erro na função unificada batch:`, error);
      throw new Error(error.message || `Erro na revisão em lote ${platform}`);
    }

    if (!data.success) {
      console.error(`[unifiedReviewService] Falha na revisão em lote:`, data.error);
      throw new Error(data.error || `Falha na revisão em lote ${platform}`);
    }

    if (onSuccess) onSuccess();

    console.log(`[unifiedReviewService] Revisão em lote concluída: ${data.successCount} sucessos, ${data.errorCount} falhas`);
    
    return { 
      successCount: data.successCount, 
      errorCount: data.errorCount,
      results: data.results
    };

  } catch (error) {
    console.error(`[unifiedReviewService] Erro na revisão em lote:`, error);
    throw error;
  }
};
