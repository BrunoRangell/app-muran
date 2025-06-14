
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
    
    const { data, error } = await supabase
      .from('campaign_health_snapshots')
      .select(`
        *,
        clients!inner(id, company_name)
      `)
      .eq('snapshot_date', today)
      .order('clients(company_name)');

    if (error) {
      throw new Error(`Erro ao buscar snapshots: ${error.message}`);
    }

    return data || [];
  }

  static async fetchLatestSnapshots(): Promise<CampaignHealthSnapshot[]> {
    const { data, error } = await supabase
      .from('campaign_health_snapshots')
      .select(`
        *,
        clients!inner(id, company_name)
      `)
      .order('snapshot_date', { ascending: false })
      .order('clients(company_name)')
      .limit(100);

    if (error) {
      throw new Error(`Erro ao buscar snapshots recentes: ${error.message}`);
    }

    return data || [];
  }

  static async generateSnapshots(): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('active-campaigns-health', {
        body: { timestamp: new Date().toISOString() }
      });

      if (error) {
        console.error("Erro na edge function:", error);
        return false;
      }

      return data?.success || false;
    } catch (error) {
      console.error("Erro ao gerar snapshots:", error);
      return false;
    }
  }

  static async forceRefreshSnapshots(): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('active-campaigns-health', {
        body: { 
          timestamp: new Date().toISOString(),
          forceRefresh: true 
        }
      });

      if (error) {
        console.error("Erro ao forçar refresh:", error);
        return false;
      }

      return data?.success || false;
    } catch (error) {
      console.error("Erro ao forçar refresh:", error);
      return false;
    }
  }
}
