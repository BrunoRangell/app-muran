
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ReviewClientParams {
  clientId: string;
  accountId?: string;
  platform: "meta" | "google";
}

export const reviewClient = async ({ clientId, accountId, platform }: ReviewClientParams) => {
  console.log(`[unifiedReviewService] Iniciando revisão para cliente ${clientId} (${platform})${accountId ? ` com conta ${accountId}` : ''}`);

  try {
    const reviewDate = new Date().toISOString().split('T')[0];
    
    if (platform === "meta") {
      const payload = {
        clientId,
        reviewDate,
        ...(accountId && { metaAccountId: accountId })
      };

      const { data, error } = await supabase.functions.invoke("unified-meta-review", {
        body: payload
      });
      
      if (error) throw error;
      console.log(`[unifiedReviewService] Revisão Meta unificada concluída para cliente ${clientId}:`, data);
      return data;
    } else {
      const payload = {
        clientId,
        reviewDate,
        fetchRealData: true,
        googleAccountId: accountId
      };

      const { data, error } = await supabase.functions.invoke("daily-google-review", {
        body: payload
      });
      
      if (error) throw error;
      console.log(`[unifiedReviewService] Revisão Google concluída para cliente ${clientId}:`, data);
      return data;
    }
    
  } catch (error: any) {
    console.error(`[unifiedReviewService] Erro ao revisar cliente ${clientId} (${platform}):`, error);
    throw error;
  }
};

export const reviewAllClients = async (
  clients: any[], 
  platform: "meta" | "google",
  onSuccess?: () => void
) => {
  console.log(`[unifiedReviewService] Revisando ${clients.length} clientes (${platform})`);
  
  if (platform === "meta") {
    try {
      const reviewDate = new Date().toISOString().split('T')[0];
      const clientIds = clients.map(client => client.id);
      
      const { data, error } = await supabase.functions.invoke("unified-meta-review", {
        body: { clientIds, reviewDate }
      });
      
      if (error) throw error;
      
      console.log(`[unifiedReviewService] Batch Meta concluído:`, data);
      
      if (onSuccess) onSuccess();
      
      return {
        successCount: data?.data?.summary?.success_count || 0,
        errorCount: data?.data?.summary?.error_count || 0,
        successful: data?.data?.results?.filter(r => r.status === 'success').map(r => r.data?.client?.name || r.clientId) || [],
        failed: data?.data?.errors?.map(e => e.clientId) || []
      };
    } catch (error) {
      console.error(`[unifiedReviewService] Erro no batch Meta:`, error);
      throw error;
    }
  } else {
    const successfulReviews: string[] = [];
    const failedReviews: string[] = [];
    
    for (const client of clients) {
      try {
        // Validar se o cliente tem google_account_id antes de tentar revisar
        const googleAccountId = client.google_account_id;
        
        if (!googleAccountId) {
          console.warn(`[unifiedReviewService] Cliente ${client.company_name} (${client.id}) não tem conta Google configurada - pulando`);
          failedReviews.push(client.company_name);
          continue;
        }
        
        await reviewClient({ 
          clientId: client.id, 
          accountId: googleAccountId, 
          platform 
        });
        successfulReviews.push(client.company_name);
      } catch (error) {
        console.error(`[unifiedReviewService] Erro ao revisar cliente ${client.id}:`, error);
        failedReviews.push(client.company_name);
      }
    }
    
    if (onSuccess) onSuccess();
    
    return {
      successCount: successfulReviews.length,
      errorCount: failedReviews.length,
      successful: successfulReviews,
      failed: failedReviews
    };
  }
};
