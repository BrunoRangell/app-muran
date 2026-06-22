import { CampaignHealthData } from "./types.ts";
import { metaFetchWithRetry, MetaRateLimitError } from "./meta-api.ts";

const META_ZERO_STREAK_WINDOW_DAYS = 10;

// Função para obter a data atual no timezone brasileiro
function getTodayInBrazil(): string {
  const now = new Date();
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const brazilTime = new Date(utcTime + (-3 * 3600000));
  
  const year = brazilTime.getFullYear();
  const month = String(brazilTime.getMonth() + 1).padStart(2, '0');
  const day = String(brazilTime.getDate()).padStart(2, '0');
  
  const result = `${year}-${month}-${day}`;
  console.log(`🇧🇷 [CAMPAIGNS] Data atual no timezone brasileiro: ${result}`);
  return result;
}

function shiftIsoDate(dateStr: string, deltaDays: number): string {
  const [y, m, d] = dateStr.split('-').map((n) => parseInt(n, 10));
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  const yyyy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}


// Buscar dados do Meta Ads para campanhas
async function fetchMetaActiveCampaigns(accessToken: string, accountId: string): Promise<{ cost: number; impressions: number; activeCampaigns: number; campaignsDetails: any[] }> {
  try {
    const today = getTodayInBrazil();
    console.log(`🔍 [CAMPAIGNS] Buscando campanhas Meta para conta ${accountId} na data ${today}`);

    // Buscar TODAS as campanhas paginando o cursor da Meta.
    // Sem paginação, contas com >25 campanhas perdiam as últimas (bug histórico).
    const allCampaigns: any[] = [];
    let nextUrl: string | null =
      `https://graph.facebook.com/v24.0/act_${accountId}/campaigns?fields=id,name,effective_status&limit=200&access_token=${accessToken}`;
    let pageCount = 0;
    const MAX_PAGES = 20; // proteção contra loop infinito (até 4000 campanhas)

    while (nextUrl && pageCount < MAX_PAGES) {
      pageCount++;
      const resp = await metaFetchWithRetry(nextUrl);
      const json = await resp.json();

      if (!resp.ok || json.error) {
        console.error(`❌ [CAMPAIGNS] Erro ao buscar campanhas (página ${pageCount}):`, json.error || resp.status);
        if (resp.status === 429 || resp.status >= 500) {
          throw new MetaRateLimitError(resp.status, `Meta rate-limit ao listar campanhas (${resp.status})`);
        }
        if (allCampaigns.length === 0) {
          return { cost: 0, impressions: 0, activeCampaigns: 0, campaignsDetails: [] };
        }
        break;
      }

      if (Array.isArray(json.data)) {
        allCampaigns.push(...json.data);
      }

      nextUrl = json.paging?.next || null;
    }

    if (allCampaigns.length === 0) {
      console.log(`⚠️ [CAMPAIGNS] Nenhuma campanha encontrada para conta ${accountId}`);
      return { cost: 0, impressions: 0, activeCampaigns: 0, campaignsDetails: [] };
    }

    const activeCampaigns = allCampaigns.filter((campaign: any) =>
      campaign.effective_status === 'ACTIVE'
    );

    console.log(`✅ [CAMPAIGNS] ${activeCampaigns.length} ativas de ${allCampaigns.length} totais (${pageCount} página(s))`);

    if (activeCampaigns.length === 0) {
      return { cost: 0, impressions: 0, activeCampaigns: 0, campaignsDetails: [] };
    }

    // ============================================================
    // UMA ÚNICA CHAMADA AGREGADA: insights diários por campanha numa
    // janela de 10 dias. Antes fazíamos 1 request por campanha (N+1),
    // o que estourava o rate-limit da Meta em contas com muitas campanhas.
    // ============================================================
    const yesterday = shiftIsoDate(today, -1);
    const windowStart = shiftIsoDate(today, -META_ZERO_STREAK_WINDOW_DAYS);

    const aggregatedUrl =
      `https://graph.facebook.com/v24.0/act_${accountId}/insights` +
      `?level=campaign&fields=campaign_id,spend,impressions` +
      `&time_range={"since":"${windowStart}","until":"${today}"}` +
      `&time_increment=1&limit=500&access_token=${accessToken}`;

    // Mapa: campaign_id -> Map<dateISO, {cost, impressions}>
    const dailyByCampaign = new Map<string, Map<string, { cost: number; impressions: number }>>();
    let aggregatedFailed = false;
    let aggregatedRateLimited = false;

    try {
      let aggUrl: string | null = aggregatedUrl;
      let aggPage = 0;
      while (aggUrl && aggPage < 20) {
        aggPage++;
        const aggResp = await metaFetchWithRetry(aggUrl);
        if (!aggResp.ok) {
          const body = await aggResp.text();
          console.error(`❌ [CAMPAIGNS] Insights agregados falharam (${aggResp.status}):`, body.slice(0, 300));
          if (aggResp.status === 429 || aggResp.status >= 500) aggregatedRateLimited = true;
          aggregatedFailed = true;
          break;
        }
        const aggJson = await aggResp.json();
        if (Array.isArray(aggJson.data)) {
          for (const row of aggJson.data) {
            const cid = row.campaign_id;
            const date = row.date_start || row.date_stop;
            if (!cid || !date) continue;
            let m = dailyByCampaign.get(cid);
            if (!m) {
              m = new Map();
              dailyByCampaign.set(cid, m);
            }
            m.set(date, {
              cost: parseFloat(row.spend || '0'),
              impressions: parseInt(row.impressions || '0'),
            });
          }
        }
        aggUrl = aggJson.paging?.next || null;
      }
    } catch (e) {
      console.error(`❌ [CAMPAIGNS] Erro ao buscar insights agregados:`, e);
      aggregatedFailed = true;
    }

    // Se a Meta deu rate-limit no agregado, propaga para o caller marcar a revisão como falha
    // em vez de gravar "tudo zerado" no campaign_health.
    if (aggregatedRateLimited) {
      throw new MetaRateLimitError(429, 'Meta rate-limit nos insights agregados de campanha');
    }

    let totalCost = 0;
    let totalImpressions = 0;
    const campaignsDetails: any[] = [];

    for (const campaign of activeCampaigns) {
      const daily = dailyByCampaign.get(campaign.id);
      let campaignCost = 0;
      let campaignImpressions = 0;
      let cost2d = 0;
      let impressions2d = 0;
      let zeroDaysStreak: number | null = 0;
      let dataUnavailable = false;

      if (aggregatedFailed || !daily || daily.size === 0) {
        // Sem dados para essa campanha — não inferimos "zerado"
        dataUnavailable = true;
        zeroDaysStreak = null;
      } else {
        const todayEntry = daily.get(today);
        if (todayEntry) {
          campaignCost = todayEntry.cost;
          campaignImpressions = todayEntry.impressions;
        }
        const yEntry = daily.get(yesterday);
        cost2d = campaignCost + (yEntry?.cost ?? 0);
        impressions2d = campaignImpressions + (yEntry?.impressions ?? 0);

        let streak = 0;
        for (let k = 1; k <= META_ZERO_STREAK_WINDOW_DAYS; k++) {
          const day = shiftIsoDate(today, -k);
          const d = daily.get(day);
          if (!d) break;
          if (d.cost === 0 && d.impressions === 0) streak++;
          else break;
        }
        zeroDaysStreak = streak;
      }

      totalCost += campaignCost;
      totalImpressions += campaignImpressions;

      campaignsDetails.push({
        id: campaign.id,
        name: campaign.name,
        cost: campaignCost,
        impressions: campaignImpressions,
        cost_2d: cost2d,
        impressions_2d: impressions2d,
        zero_days_streak: zeroDaysStreak,
        data_unavailable: dataUnavailable,
        status: campaign.effective_status,
      });
    }

    console.log(`💰 [CAMPAIGNS] Hoje: R$ ${totalCost.toFixed(2)} | ${totalImpressions} impr | ${campaignsDetails.length} ativas`);

    return {
      cost: totalCost,
      impressions: totalImpressions,
      activeCampaigns: activeCampaigns.length,
      campaignsDetails,
    };

  } catch (error) {
    console.error(`❌ [CAMPAIGNS] Erro para conta ${accountId}:`, error);
    if (error instanceof MetaRateLimitError) throw error;
    return { cost: 0, impressions: 0, activeCampaigns: 0, campaignsDetails: [] };
  }
}

// Função para atualizar dados de campaign health
export async function updateCampaignHealth(
  supabase: any, 
  clientId: string, 
  accountId: string, 
  accessToken: string, 
  snapshotDate: string
): Promise<void> {
  const startTime = Date.now();
  console.log(`📊 [CAMPAIGNS] Iniciando atualização de campaign health para cliente ${clientId}`);
  
  try {
    // Buscar dados da conta Meta específica
    const { data: accountData, error: accountError } = await supabase
      .from('client_accounts')
      .select('id, account_id')
      .eq('client_id', clientId)
      .eq('account_id', accountId)
      .eq('platform', 'meta')
      .eq('status', 'active')
      .single();

    if (accountError || !accountData) {
      console.error(`❌ [CAMPAIGNS] Erro ao buscar dados da conta:`, accountError);
      return;
    }

    // Buscar dados das campanhas Meta
    const campaignData = await fetchMetaActiveCampaigns(accessToken, accountData.account_id);
    
    // Calcular campanhas sem veiculação baseado nos dados detalhados (ignora campanhas com dados indisponíveis)
    const unservedCampaigns = campaignData.campaignsDetails.filter(campaign =>
      !campaign.data_unavailable && campaign.cost === 0 && campaign.impressions === 0
    ).length;

    const healthSnapshot: CampaignHealthData = {
      client_id: clientId,
      account_id: accountData.id,
      snapshot_date: snapshotDate,
      platform: 'meta',
      has_account: true,
      active_campaigns_count: campaignData.activeCampaigns,
      unserved_campaigns_count: unservedCampaigns,
      cost_today: campaignData.cost,
      impressions_today: campaignData.impressions,
      campaigns_detailed: campaignData.campaignsDetails
    };

    // Verificar se já existe registro para hoje
    const { data: existing, error: checkError } = await supabase
      .from('campaign_health')
      .select('id')
      .eq('client_id', clientId)
      .eq('account_id', accountData.id)
      .eq('snapshot_date', snapshotDate)
      .eq('platform', 'meta')
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error(`❌ [CAMPAIGNS] Erro ao verificar registro existente:`, checkError);
      return;
    }

    if (existing) {
      // Atualizar registro existente
      const { error: updateError } = await supabase
        .from('campaign_health')
        .update({
          has_account: healthSnapshot.has_account,
          active_campaigns_count: healthSnapshot.active_campaigns_count,
          unserved_campaigns_count: healthSnapshot.unserved_campaigns_count,
          cost_today: healthSnapshot.cost_today,
          impressions_today: healthSnapshot.impressions_today,
          campaigns_detailed: healthSnapshot.campaigns_detailed,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error(`❌ [CAMPAIGNS] Erro ao atualizar campaign health:`, updateError);
      } else {
        const time = Date.now() - startTime;
        console.log(`✅ [CAMPAIGNS] Campaign health atualizado (${time}ms)`);
      }
    } else {
      // Criar novo registro
      const { error: insertError } = await supabase
        .from('campaign_health')
        .insert(healthSnapshot);

      if (insertError) {
        console.error(`❌ [CAMPAIGNS] Erro ao inserir campaign health:`, insertError);
      } else {
        const time = Date.now() - startTime;
        console.log(`✅ [CAMPAIGNS] Campaign health criado (${time}ms)`);
      }
    }

  } catch (error) {
    const time = Date.now() - startTime;
    console.error(`❌ [CAMPAIGNS] Erro ao atualizar campaign health (${time}ms):`, error);
  }
}