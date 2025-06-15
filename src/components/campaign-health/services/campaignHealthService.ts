
import { supabase } from "@/lib/supabase";
import { getTodayInBrazil } from "@/utils/brazilTimezone";

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
  // Verificar se o usuário está autenticado antes de fazer qualquer operação
  private static async checkAuthAndTeamMembership() {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      throw new Error('Usuário não autenticado. Faça login para continuar.');
    }

    // Verificar se o usuário é membro da equipe
    const { data: teamMember, error: teamError } = await supabase
      .from('team_members')
      .select('id, permission, role')
      .eq('manager_id', session.user.id)
      .single();

    if (teamError || !teamMember) {
      throw new Error('Acesso negado. Usuário não é membro da equipe.');
    }

    return { session, teamMember };
  }

  static async fetchTodaySnapshots(): Promise<CampaignHealthSnapshot[]> {
    try {
      // Verificar autenticação primeiro
      await this.checkAuthAndTeamMembership();

      const today = getTodayInBrazil();
      
      console.log(`📅 Buscando snapshots de hoje (timezone brasileiro): ${today}`);
      
      const { data, error } = await supabase
        .from('campaign_health_snapshots')
        .select(`
          *,
          clients!inner(id, company_name)
        `)
        .eq('snapshot_date', today)
        .order('clients(company_name)');

      if (error) {
        console.error("❌ Erro ao buscar snapshots:", error);
        throw new Error(`Erro ao buscar snapshots: ${error.message}`);
      }

      console.log(`✅ Encontrados ${data?.length || 0} snapshots para hoje (timezone brasileiro)`);
      return data || [];
    } catch (error) {
      console.error("❌ Erro na busca de snapshots:", error);
      throw error;
    }
  }

  static async generateTodaySnapshots(): Promise<boolean> {
    try {
      // Verificar autenticação primeiro
      const { teamMember } = await this.checkAuthAndTeamMembership();

      // Apenas admins podem gerar snapshots manualmente
      if (teamMember.permission !== 'admin') {
        throw new Error('Apenas administradores podem gerar snapshots manualmente.');
      }

      const today = getTodayInBrazil();
      console.log(`🔧 Gerando snapshots para hoje (timezone brasileiro): ${today}`);
      
      const { data, error } = await supabase.functions.invoke('active-campaigns-health', {
        body: { 
          timestamp: new Date().toISOString(),
          action: 'generate_snapshots',
          force_today_only: true,
          brazil_timezone: true
        }
      });

      if (error) {
        console.error("❌ Erro na edge function:", error);
        return false;
      }

      console.log("✅ Edge function executada:", data);
      return data?.success || false;
    } catch (error) {
      console.error("❌ Erro ao gerar snapshots:", error);
      throw error;
    }
  }

  static async forceRefreshTodaySnapshots(): Promise<boolean> {
    try {
      // Verificar autenticação primeiro
      const { teamMember } = await this.checkAuthAndTeamMembership();

      // Apenas admins podem forçar refresh
      if (teamMember.permission !== 'admin') {
        throw new Error('Apenas administradores podem forçar refresh dos snapshots.');
      }

      const today = getTodayInBrazil();
      console.log(`🔄 Forçando refresh para hoje (timezone brasileiro): ${today}`);
      
      const { data, error } = await supabase.functions.invoke('active-campaigns-health', {
        body: { 
          timestamp: new Date().toISOString(),
          forceRefresh: true,
          action: 'force_refresh_today',
          target_date: today,
          brazil_timezone: true
        }
      });

      if (error) {
        console.error("❌ Erro ao forçar refresh:", error);
        return false;
      }

      console.log("✅ Refresh executado:", data);
      return data?.success || false;
    } catch (error) {
      console.error("❌ Erro ao forçar refresh:", error);
      throw error;
    }
  }

  static validateDataIsFromToday(snapshots: CampaignHealthSnapshot[]): boolean {
    const today = getTodayInBrazil();
    
    if (!snapshots || snapshots.length === 0) {
      console.log("⚠️ Nenhum snapshot encontrado");
      return false;
    }

    const allFromToday = snapshots.every(snapshot => 
      snapshot.snapshot_date === today
    );

    if (!allFromToday) {
      console.warn("❌ Alguns snapshots não são de hoje (timezone brasileiro)!");
      return false;
    }

    console.log(`✅ Todos os ${snapshots.length} snapshots são de hoje (timezone brasileiro)`);
    return true;
  }
}
