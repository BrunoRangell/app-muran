
import { supabase } from "@/lib/supabase";

export interface CampaignHealthSnapshot {
  id: string;
  client_id: string;
  snapshot_date: string;
  meta_has_account: boolean;
  meta_active_campaigns_count: number;
  meta_cost_today: number;
  meta_impressions_today: number;
  meta_account_id?: string;
  meta_account_name?: string;
  google_has_account: boolean;
  google_active_campaigns_count: number;
  google_cost_today: number;
  google_impressions_today: number;
  google_account_id?: string;
  google_account_name?: string;
  created_at: string;
  updated_at: string;
  clients: {
    id: string;
    company_name: string;
  };
}

export class CampaignHealthService {
  static async fetchTodaySnapshots(): Promise<CampaignHealthSnapshot[]> {
    const today = new Date().toISOString().split('T')[0];
    
    console.log(`📅 Buscando APENAS snapshots de hoje: ${today}`);
    
    const { data, error } = await supabase
      .from('campaign_health_snapshots')
      .select(`
        *,
        clients!inner(id, company_name)
      `)
      .eq('snapshot_date', today) // SEMPRE apenas hoje
      .order('clients(company_name)');

    if (error) {
      console.error("❌ Erro ao buscar snapshots de hoje:", error);
      throw new Error(`Erro ao buscar snapshots: ${error.message}`);
    }

    console.log(`✅ Encontrados ${data?.length || 0} snapshots APENAS para hoje (${today})`);
    return data || [];
  }

  // Método removido: fetchLatestSnapshots - não usaremos mais dados históricos

  static async generateTodaySnapshots(): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0];
      console.log(`🔧 Gerando snapshots APENAS para hoje: ${today}`);
      
      const { data, error } = await supabase.functions.invoke('active-campaigns-health', {
        body: { 
          timestamp: new Date().toISOString(),
          action: 'generate_snapshots',
          force_today_only: true // Flag para garantir apenas dados de hoje
        }
      });

      if (error) {
        console.error("❌ Erro na edge function:", error);
        return false;
      }

      console.log("✅ Edge function executada para dados de hoje:", data);
      return data?.success || false;
    } catch (error) {
      console.error("❌ Erro ao gerar snapshots de hoje:", error);
      return false;
    }
  }

  static async forceRefreshTodaySnapshots(): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0];
      console.log(`🔄 Forçando refresh APENAS para hoje: ${today}`);
      
      const { data, error } = await supabase.functions.invoke('active-campaigns-health', {
        body: { 
          timestamp: new Date().toISOString(),
          forceRefresh: true,
          action: 'force_refresh_today',
          target_date: today // Especificar data exata
        }
      });

      if (error) {
        console.error("❌ Erro ao forçar refresh de hoje:", error);
        return false;
      }

      console.log("✅ Refresh forçado executado para hoje:", data);
      return data?.success || false;
    } catch (error) {
      console.error("❌ Erro ao forçar refresh de hoje:", error);
      return false;
    }
  }

  // Novo método para validar se dados são realmente de hoje
  static validateDataIsFromToday(snapshots: CampaignHealthSnapshot[]): boolean {
    const today = new Date().toISOString().split('T')[0];
    
    if (!snapshots || snapshots.length === 0) {
      console.log("⚠️ Nenhum snapshot encontrado");
      return false;
    }

    const allFromToday = snapshots.every(snapshot => 
      snapshot.snapshot_date === today
    );

    if (!allFromToday) {
      console.warn("❌ Alguns snapshots não são de hoje! Invalidando dados.");
      return false;
    }

    console.log(`✅ Todos os ${snapshots.length} snapshots são de hoje (${today})`);
    return true;
  }
}
