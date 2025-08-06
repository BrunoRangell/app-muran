
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Serviço para gerenciar atualizações em tempo real de dados
 */
export class RealTimeDataService {
  private queryClient: any;
  
  constructor(queryClient: any) {
    this.queryClient = queryClient;
  }

  /**
   * Força atualização de todos os dados relacionados às revisões
   */
  async forceDataRefresh() {
    console.log("🔄 Forçando atualização de todos os dados...");
    
    const queriesToInvalidate = [
      "improved-meta-reviews",
      "improved-google-reviews", 
      "unified-reviews-data",
      "google-ads-data",
      "last-batch-review-meta",
      "last-batch-review-google",
      "clients-with-reviews",
      "daily-budget-reviews",
      "google-ads-reviews",
      "client-current-reviews"
    ];
    
    for (const queryKey of queriesToInvalidate) {
      await this.queryClient.invalidateQueries({ queryKey: [queryKey] });
    }
    
    // Aguardar um pouco para permitir que as queries sejam refeitas
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log("✅ Atualização de dados concluída");
  }

  /**
   * Verifica se há atualizações pendentes no banco
   */
  async checkForUpdates() {
    try {
      const { data: recentLogs } = await supabase
        .from('system_logs')
        .select('created_at, event_type, details')
        .in('event_type', ['batch_review_completed', 'client_review_completed'])
        .order('created_at', { ascending: false })
        .limit(5);
        
      return recentLogs || [];
    } catch (error) {
      console.error("❌ Erro ao verificar atualizações:", error);
      return [];
    }
  }

  /**
   * Inicia polling para verificar atualizações
   */
  startPolling(intervalMs: number = 30000) {
    return setInterval(async () => {
      const updates = await this.checkForUpdates();
      
      if (updates.length > 0) {
        const latestUpdate = updates[0];
        const timeSinceUpdate = Date.now() - new Date(latestUpdate.created_at).getTime();
        
        // Se a atualização é muito recente (menos de 2 minutos), forçar refresh
        if (timeSinceUpdate < 120000) {
          console.log("🔄 Atualização recente detectada, atualizando dados...");
          await this.forceDataRefresh();
        }
      }
    }, intervalMs);
  }
}

/**
 * Hook para usar o serviço de dados em tempo real
 */
export const useRealTimeDataService = () => {
  const queryClient = useQueryClient();
  
  const service = new RealTimeDataService(queryClient);
  
  return {
    forceDataRefresh: () => service.forceDataRefresh(),
    checkForUpdates: () => service.checkForUpdates(),
    startPolling: (interval?: number) => service.startPolling(interval)
  };
};
