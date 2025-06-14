
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

  static async generateTodaySnapshots(): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0];
      console.log(`🔧 Gerando snapshots APENAS para hoje: ${today}`);
      
      const { data, error } = await supabase.functions.invoke('active-campaigns-health', {
        body: { 
          timestamp: new Date().toISOString(),
          action: 'generate_snapshots',
          force_today_only: true,
          automated_system: true // Flag para indicar que o sistema é automatizado
        }
      });

      if (error) {
        console.error("❌ Erro na edge function:", error);
        return false;
      }

      console.log("✅ Edge function executada para dados de hoje (SISTEMA AUTOMATIZADO):", data);
      return data?.success || false;
    } catch (error) {
      console.error("❌ Erro ao gerar snapshots de hoje:", error);
      return false;
    }
  }

  static async forceRefreshTodaySnapshots(): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0];
      console.log(`🔄 Forçando refresh APENAS para hoje: ${today} (SISTEMA AUTOMATIZADO)`);
      
      const { data, error } = await supabase.functions.invoke('active-campaigns-health', {
        body: { 
          timestamp: new Date().toISOString(),
          forceRefresh: true,
          action: 'force_refresh_today',
          target_date: today,
          automated_system: true // Flag para indicar sistema automatizado
        }
      });

      if (error) {
        console.error("❌ Erro ao forçar refresh de hoje:", error);
        return false;
      }

      console.log("✅ Refresh forçado executado para hoje (SISTEMA AUTOMATIZADO):", data);
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

    console.log(`✅ Todos os ${snapshots.length} snapshots são de hoje (${today}) - SISTEMA AUTOMATIZADO ATIVO`);
    return true;
  }

  // Novo método para verificar status do sistema automatizado
  static async checkAutomatedSystemStatus(): Promise<{
    tokenRenewal: 'active' | 'inactive' | 'error';
    lastTokenUpdate: string | null;
    minutesSinceUpdate: number;
    systemStatus: 'healthy' | 'warning' | 'critical';
    nextRenewalIn: number; // minutos
  }> {
    try {
      // Verificar último update do token
      const { data: tokenData, error: tokenError } = await supabase
        .from('api_tokens')
        .select('updated_at')
        .eq('name', 'google_ads_access_token')
        .single();

      if (tokenError || !tokenData) {
        return {
          tokenRenewal: 'error',
          lastTokenUpdate: null,
          minutesSinceUpdate: 0,
          systemStatus: 'critical',
          nextRenewalIn: 0
        };
      }

      const lastUpdate = new Date(tokenData.updated_at);
      const now = new Date();
      const minutesSinceUpdate = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60));
      
      // Sistema renova a cada 30 minutos
      const nextRenewalIn = Math.max(0, 30 - (minutesSinceUpdate % 30));

      let systemStatus: 'healthy' | 'warning' | 'critical';
      if (minutesSinceUpdate > 60) {
        systemStatus = 'critical';
      } else if (minutesSinceUpdate > 45) {
        systemStatus = 'warning';
      } else {
        systemStatus = 'healthy';
      }

      return {
        tokenRenewal: 'active',
        lastTokenUpdate: lastUpdate.toISOString(),
        minutesSinceUpdate,
        systemStatus,
        nextRenewalIn
      };
    } catch (error) {
      console.error("❌ Erro ao verificar status do sistema automatizado:", error);
      return {
        tokenRenewal: 'error',
        lastTokenUpdate: null,
        minutesSinceUpdate: 0,
        systemStatus: 'critical',
        nextRenewalIn: 0
      };
    }
  }
}
