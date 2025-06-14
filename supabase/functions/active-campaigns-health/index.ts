
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
      console.log(`Meta: Erro ao buscar campanhas para conta ${accountId}:`, campaignsData.error?.message || 'Resposta inválida');
      return { cost: 0, impressions: 0, activeCampaigns: 0 };
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
    console.error(`Meta: Erro ao buscar dados para conta ${accountId}:`, error);
    return { cost: 0, impressions: 0, activeCampaigns: 0 };
  }
}

// Função para buscar dados do Google Ads
async function fetchGoogleActiveCampaigns(clientCustomerId: string): Promise<{ cost: number; impressions: number; activeCampaigns: number }> {
  try {
    // Por enquanto retornamos dados mock - implementação real requer Google Ads API
    // TODO: Implementar chamada real à Google Ads API
    console.log(`Google: Processando conta ${clientCustomerId} (mock data)`);
    return { cost: 0, impressions: 0, activeCampaigns: 0 };
  } catch (error) {
    console.error(`Google: Erro ao buscar dados para conta ${clientCustomerId}:`, error);
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

    // Buscar todos os clientes ativos com seus account_ids diretamente da tabela clients
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, company_name, meta_account_id, google_account_id')
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

      // Processar Meta Ads
      if (client.meta_account_id && client.meta_account_id.trim() !== '') {
        // Cliente tem conta Meta configurada
        const metaData = await fetchMetaActiveCampaigns(metaToken.value, client.meta_account_id);
        
        healthData.push({
          clientId: client.id,
          clientName: client.company_name,
          platform: 'meta',
          hasAccount: true,
          hasActiveCampaigns: metaData.activeCampaigns > 0,
          costToday: metaData.cost,
          impressionsToday: metaData.impressions,
          activeCampaignsCount: metaData.activeCampaigns,
          accountId: client.meta_account_id,
          accountName: `Meta Ads - ${client.meta_account_id}`
        });
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
      if (client.google_account_id && client.google_account_id.trim() !== '') {
        // Cliente tem conta Google configurada
        const googleData = await fetchGoogleActiveCampaigns(client.google_account_id);
        
        healthData.push({
          clientId: client.id,
          clientName: client.company_name,
          platform: 'google',
          hasAccount: true,
          hasActiveCampaigns: googleData.activeCampaigns > 0,
          costToday: googleData.cost,
          impressionsToday: googleData.impressions,
          activeCampaignsCount: googleData.activeCampaigns,
          accountId: client.google_account_id,
          accountName: `Google Ads - ${client.google_account_id}`
        });
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

    console.log(`📈 Dados processados: ${healthData.length} registros de saúde (${clients?.length || 0} clientes × 2 plataformas)`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: healthData,
        timestamp: new Date().toISOString(),
        totalClients: clients?.length || 0,
        totalRecords: healthData.length
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
