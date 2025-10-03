
import { supabase } from "@/integrations/supabase/client";
import { getTodayInBrazil } from "@/utils/brazilTimezone";
import type { Session } from "@supabase/supabase-js";


export interface CampaignHealthSnapshot {
  id: string;
  client_id: string;
  snapshot_date: string;
  platform: string;
  has_account: boolean;
  active_campaigns_count: number;
  cost_today: number;
  impressions_today: number;
  account_id: string;
  account_name: string;
  created_at: string;
  updated_at: string;
  clients: {
    id: string;
    company_name: string;
  };
}

interface AuthCheckResult {
  session: Session;
  teamMember: {
    id: string;
    role: string;
  };
  isAdmin: boolean;
}

export class CampaignHealthService {
  // Verificar se o usuário está autenticado antes de fazer qualquer operação
  private static async checkAuthAndTeamMembership(): Promise<AuthCheckResult> {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      throw new Error('Usuário não autenticado. Faça login para continuar.');
    }

    // Verificar se o usuário é membro da equipe
    const { data: teamMember, error: teamError } = await supabase
      .from('team_members')
      .select('id, role')
      .eq('manager_id', session.user.id)
      .single();

    if (teamError || !teamMember) {
      throw new Error('Acesso negado. Usuário não é membro da equipe.');
    }

    // Verificar roles usando user_roles table
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id);
    
    const isAdmin = roles?.some(r => r.role === 'admin') || false;

    return { session, teamMember, isAdmin };
  }

  static async fetchTodaySnapshots(): Promise<CampaignHealthSnapshot[]> {
    try {
      // Verificar autenticação primeiro
      await this.checkAuthAndTeamMembership();

      const today = getTodayInBrazil();
      
      console.log(`📅 Buscando snapshots de hoje da estrutura unificada (timezone brasileiro): ${today}`);
      
      const { data, error } = await supabase
        .from('campaign_health')
        .select(`
          *,
          client_accounts!inner(
            account_id,
            account_name,
            clients!inner(id, company_name)
          )
        `)
        .eq('snapshot_date', today);

      if (error) {
        console.error("❌ Erro ao buscar snapshots:", error);
        throw new Error(`Erro ao buscar snapshots: ${error.message}`);
      }

      // Transformar dados para o formato esperado e ordenar por nome da empresa
      const snapshots = data?.map((item: any) => ({
        id: item.id,
        client_id: item.client_id,
        snapshot_date: item.snapshot_date,
        platform: item.platform,
        has_account: item.has_account,
        active_campaigns_count: item.active_campaigns_count,
        cost_today: item.cost_today,
        impressions_today: item.impressions_today,
        account_id: item.client_accounts.account_id,
        account_name: item.client_accounts.account_name,
        created_at: item.created_at,
        updated_at: item.updated_at,
        clients: {
          id: item.client_accounts.clients.id,
          company_name: item.client_accounts.clients.company_name
        }
      })).sort((a: any, b: any) => a.clients.company_name.localeCompare(b.clients.company_name)) || [];

      console.log(`✅ Encontrados ${snapshots.length} snapshots para hoje (timezone brasileiro)`);
      return snapshots;
    } catch (error) {
      console.error("❌ Erro na busca de snapshots:", error);
      throw error;
    }
  }

  static async generateTodaySnapshots(): Promise<boolean> {
    try {
      // Verificar autenticação primeiro
      const { isAdmin } = await this.checkAuthAndTeamMembership();

      // Apenas admins podem gerar snapshots manualmente
      if (!isAdmin) {
        throw new Error('Apenas administradores podem gerar snapshots manualmente.');
      }

      const today = getTodayInBrazil();
      console.log(`🔧 Gerando snapshots para hoje (timezone brasileiro): ${today}`);
      
      const { data, error } = await supabase.functions.invoke('unified-meta-review', {
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
      const { isAdmin } = await this.checkAuthAndTeamMembership();

      // Apenas admins podem forçar refresh
      if (!isAdmin) {
        throw new Error('Apenas administradores podem forçar refresh dos snapshots.');
      }

      const today = getTodayInBrazil();
      console.log(`🔄 Forçando refresh para hoje (timezone brasileiro): ${today}`);
      
      const { data, error } = await supabase.functions.invoke('unified-meta-review', {
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
