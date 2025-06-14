
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CampaignHealthData {
  clientId: string;
  clientName: string;
  platform: 'meta' | 'google';
  hasAccount: boolean;
  hasActiveCampaigns: boolean;
  costToday: number;
  impressionsToday: number;
  activeCampaignsCount: number;
  accountId?: string;
  accountName?: string;
}

// Função para buscar dados do Meta Ads
async function fetchMetaActiveCampaigns(accessToken: string, accountId: string): Promise<{ cost: number; impressions: number; activeCampaigns: number }> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Buscar campanhas ativas
    const campaignsUrl = `https://graph.facebook.com/v18.0/act_${accountId}/campaigns?fields=id,name,effective_status&access_token=${accessToken}`;
    const campaignsResponse = await fetch(campaignsUrl);
    const campaignsData = await campaignsResponse.json();
    
    if (!campaignsData.data) {
      throw new Error(`Erro ao buscar campanhas: ${campaignsData.error?.message || 'Resposta inválida'}`);
    }
    
    // Filtrar apenas campanhas ativas
    const activeCampaigns = campaignsData.data.filter((campaign: any) => 
      campaign.effective_status === 'ACTIVE'
    );
    
    if (activeCampaigns.length === 0) {
      return { cost: 0, impressions: 0, activeCampaigns: 0 };
    }
    
    // Buscar insights apenas das campanhas ativas
    const campaignIds = activeCampaigns.map((c: any) => c.id).join(',');
    const insightsUrl = `https://graph.facebook.com/v18.0/${accountId}/insights?fields=spend,impressions&time_range={"since":"${today}","until":"${today}"}&level=campaign&breakdowns=[]&filtering=[{"field":"campaign.id","operator":"IN","value":["${campaignIds.split(',').join('","')}"]}]&access_token=${accessToken}`;
    
    const insightsResponse = await fetch(insightsUrl);
    const insightsData = await insightsResponse.json();
    
    if (!insightsData.data) {
      return { cost: 0, impressions: 0, activeCampaigns: activeCampaigns.length };
    }
    
    // Somar custos e impressões
    const totalCost = insightsData.data.reduce((sum: number, insight: any) => 
      sum + parseFloat(insight.spend || '0'), 0
    );
    const totalImpressions = insightsData.data.reduce((sum: number, insight: any) => 
      sum + parseInt(insight.impressions || '0'), 0
    );
    
    return {
      cost: totalCost,
      impressions: totalImpressions,
      activeCampaigns: activeCampaigns.length
    };
    
  } catch (error) {
    console.error('Erro ao buscar dados Meta:', error);
    return { cost: 0, impressions: 0, activeCampaigns: 0 };
  }
}

// Função para buscar dados do Google Ads
async function fetchGoogleActiveCampaigns(clientCustomerId: string): Promise<{ cost: number; impressions: number; activeCampaigns: number }> {
  try {
    // Por enquanto retornamos dados mock - implementação real requer Google Ads API
    // TODO: Implementar chamada real à Google Ads API
    return { cost: 0, impressions: 0, activeCampaigns: 0 };
  } catch (error) {
    console.error('Erro ao buscar dados Google:', error);
    return { cost: 0, impressions: 0, activeCampaigns: 0 };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔍 Iniciando busca de saúde de campanhas ativas...');

    // Buscar token do Meta Ads
    const { data: metaToken } = await supabase
      .from('api_tokens')
      .select('value')
      .eq('name', 'meta_access_token')
      .maybeSingle();

    if (!metaToken?.value) {
      throw new Error('Token Meta Ads não configurado');
    }

    // Buscar todos os clientes ativos
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, company_name')
      .eq('status', 'active')
      .order('company_name');

    if (clientsError) {
      throw clientsError;
    }

    console.log(`✅ Encontrados ${clients?.length || 0} clientes ativos`);

    const healthData: CampaignHealthData[] = [];

    // Processar cada cliente
    for (const client of clients || []) {
      console.log(`📊 Processando cliente: ${client.company_name}`);

      // Buscar contas Meta do cliente
      const { data: metaAccounts } = await supabase
        .from('client_meta_accounts')
        .select('account_id, account_name')
        .eq('client_id', client.id)
        .eq('status', 'active');

      // Buscar contas Google do cliente
      const { data: googleAccounts } = await supabase
        .from('client_google_accounts')
        .select('account_id, account_name')
        .eq('client_id', client.id)
        .eq('status', 'active');

      // Processar Meta Ads
      if (metaAccounts && metaAccounts.length > 0) {
        for (const account of metaAccounts) {
          const metaData = await fetchMetaActiveCampaigns(metaToken.value, account.account_id);
          
          healthData.push({
            clientId: client.id,
            clientName: client.company_name,
            platform: 'meta',
            hasAccount: true,
            hasActiveCampaigns: metaData.activeCampaigns > 0,
            costToday: metaData.cost,
            impressionsToday: metaData.impressions,
            activeCampaignsCount: metaData.activeCampaigns,
            accountId: account.account_id,
            accountName: account.account_name
          });
        }
      } else {
        // Cliente sem conta Meta configurada
        healthData.push({
          clientId: client.id,
          clientName: client.company_name,
          platform: 'meta',
          hasAccount: false,
          hasActiveCampaigns: false,
          costToday: 0,
          impressionsToday: 0,
          activeCampaignsCount: 0
        });
      }

      // Processar Google Ads
      if (googleAccounts && googleAccounts.length > 0) {
        for (const account of googleAccounts) {
          const googleData = await fetchGoogleActiveCampaigns(account.account_id);
          
          healthData.push({
            clientId: client.id,
            clientName: client.company_name,
            platform: 'google',
            hasAccount: true,
            hasActiveCampaigns: googleData.activeCampaigns > 0,
            costToday: googleData.cost,
            impressionsToday: googleData.impressions,
            activeCampaignsCount: googleData.activeCampaigns,
            accountId: account.account_id,
            accountName: account.account_name
          });
        }
      } else {
        // Cliente sem conta Google configurada
        healthData.push({
          clientId: client.id,
          clientName: client.company_name,
          platform: 'google',
          hasAccount: false,
          hasActiveCampaigns: false,
          costToday: 0,
          impressionsToday: 0,
          activeCampaignsCount: 0
        });
      }
    }

    console.log(`📈 Dados processados: ${healthData.length} registros de saúde`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: healthData,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Erro na edge function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
