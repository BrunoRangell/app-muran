
import { supabase } from "@/lib/supabase";
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
    
    const payload = {
      clientId,
      reviewDate,
      fetchRealData: true,
      ...(platform === "meta" && { metaAccountId: accountId }),
      ...(platform === "google" && { googleAccountId: accountId })
    };

    const functionName = platform === "meta" ? "daily-meta-review" : "daily-google-review";
    
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: payload
    });
    
    if (error) throw error;
    
    console.log(`[unifiedReviewService] Revisão ${platform} concluída para cliente ${clientId}:`, data);
    return data;
    
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
  
  const successfulReviews: string[] = [];
  const failedReviews: string[] = [];
  
  for (const client of clients) {
    try {
      const accountId = platform === "meta" 
        ? client.meta_account_id 
        : client.google_account_id;
        
      await reviewClient({ 
        clientId: client.id, 
        accountId, 
        platform 
      });
      
      successfulReviews.push(client.company_name);
    } catch (error) {
      console.error(`[unifiedReviewService] Erro ao revisar cliente ${client.id}:`, error);
      failedReviews.push(client.company_name);
    }
  }
  
  console.log(`[unifiedReviewService] Revisões concluídas: ${successfulReviews.length} sucessos, ${failedReviews.length} falhas`);
  
  if (onSuccess) {
    onSuccess();
  }
  
  return {
    successCount: successfulReviews.length,
    errorCount: failedReviews.length,
    successful: successfulReviews,
    failed: failedReviews
  };
};
