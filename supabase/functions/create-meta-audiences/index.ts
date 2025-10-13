import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

const GRAPH_API_VERSION = 'v21.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

interface CreateAudienceRequest {
  action: 'fetch_accounts' | 'fetch_pixels' | 'fetch_instagram_accounts' | 'fetch_facebook_pages' | 'create_audiences' | 'create_unified_audiences';
  accountId?: string;
  audienceType?: 'site' | 'engagement';
  pixelId?: string;
  eventTypes?: string[];
  siteEvents?: string[];
  instagramAccountId?: string;
  facebookPageId?: string;
  engagementTypes?: string[];
}

// Função para buscar o token Meta do banco de dados
async function getMetaAccessToken(supabase: any): Promise<string> {
  const { data, error } = await supabase
    .from('api_tokens')
    .select('value')
    .eq('name', 'meta_access_token')
    .single();

  if (error || !data) {
    throw new Error('Token Meta Ads não encontrado no banco de dados');
  }

  return data.value;
}

// Buscar pixels de uma conta
async function fetchPixels(accountId: string, accessToken: string) {
  const url = `${GRAPH_API_BASE}/${accountId}/adspixels?fields=id,name&access_token=${accessToken}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erro ao buscar pixels: ${error}`);
  }

  const data = await response.json();
  return data.data || [];
}

// Buscar perfis Instagram vinculados
async function fetchInstagramAccounts(accountId: string, accessToken: string) {
  const url = `${GRAPH_API_BASE}/act_${accountId}?fields=instagram_accounts{id,name,username}&access_token=${accessToken}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erro ao buscar perfis Instagram: ${error}`);
  }

  const data = await response.json();
  return data.instagram_accounts?.data || [];
}

// Buscar páginas Facebook através do Business Portfolio
async function fetchFacebookPages(accountId: string, accessToken: string) {
  // Passo 1: Buscar o Business Portfolio da conta
  const businessUrl = `${GRAPH_API_BASE}/act_${accountId}?fields=business&access_token=${accessToken}`;
  const businessResponse = await fetch(businessUrl);
  
  if (!businessResponse.ok) {
    const error = await businessResponse.text();
    throw new Error(`Erro ao buscar business portfolio: ${error}`);
  }

  const businessData = await businessResponse.json();
  
  // Se não há business portfolio, retorna array vazio
  if (!businessData.business || !businessData.business.id) {
    console.log('[create-meta-audiences] Conta não possui Business Portfolio configurado');
    return [];
  }

  // Passo 2: Buscar páginas do Business Portfolio
  const pagesUrl = `${GRAPH_API_BASE}/${businessData.business.id}?fields=owned_pages{id,name}&access_token=${accessToken}`;
  const pagesResponse = await fetch(pagesUrl);
  
  if (!pagesResponse.ok) {
    const error = await pagesResponse.text();
    throw new Error(`Erro ao buscar páginas: ${error}`);
  }

  const pagesData = await pagesResponse.json();
  return pagesData.owned_pages?.data || [];
}

// Criar público de site
async function createSiteAudience(
  accountId: string,
  pixelId: string,
  eventType: string,
  retentionDays: number,
  accessToken: string
) {
  const audienceName = `[SITE] ${eventType} - ${retentionDays}D`;
  
  const rule = {
    inclusions: {
      operator: 'or',
      rules: [
        {
          event_sources: [{ id: pixelId, type: 'pixel' }],
          retention_seconds: retentionDays * 86400,
          filter: {
            operator: 'and',
            filters: [
              { field: 'event', operator: 'eq', value: eventType }
            ]
          }
        }
      ]
    }
  };

  const url = `${GRAPH_API_BASE}/${accountId}/customaudiences`;
  const body = new URLSearchParams({
    name: audienceName,
    subtype: 'WEBSITE',
    rule: JSON.stringify(rule),
    access_token: accessToken
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Erro ao criar público');
  }

  return await response.json();
}

// Criar público de engajamento
async function createEngagementAudience(
  accountId: string,
  sourceId: string,
  sourceType: 'instagram' | 'facebook',
  retentionDays: number,
  accessToken: string
) {
  const audienceName = sourceType === 'instagram' 
    ? `[IG] Envolvidos - ${retentionDays}D`
    : `[FB] Envolvidos - ${retentionDays}D`;
  
  const rule = {
    inclusions: {
      operator: 'or',
      rules: [
        {
          event_sources: [
            {
              id: sourceId,
              type: sourceType === 'instagram' ? 'instagram_account' : 'page'
            }
          ],
          retention_seconds: retentionDays * 86400,
          filter: {
            operator: 'or',
            filters: [
              { field: 'event', operator: 'eq', value: 'page_engaged' }
            ]
          }
        }
      ]
    }
  };

  const url = `${GRAPH_API_BASE}/${accountId}/customaudiences`;
  const body = new URLSearchParams({
    name: audienceName,
    subtype: 'ENGAGEMENT',
    rule: JSON.stringify(rule),
    access_token: accessToken
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Erro ao criar público');
  }

  return await response.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const requestData: CreateAudienceRequest = await req.json();
    const { action } = requestData;

    console.log('[create-meta-audiences] Action:', action);

    // Buscar token do banco de dados
    const accessToken = await getMetaAccessToken(supabase);

    if (action === 'fetch_pixels') {
      const { accountId } = requestData;
      if (!accountId) throw new Error('accountId é obrigatório');
      
      const pixels = await fetchPixels(accountId, accessToken);
      return new Response(
        JSON.stringify({ success: true, pixels }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'fetch_instagram_accounts') {
      const { accountId } = requestData;
      if (!accountId) throw new Error('accountId é obrigatório');
      
      const accounts = await fetchInstagramAccounts(accountId, accessToken);
      return new Response(
        JSON.stringify({ success: true, accounts }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'fetch_facebook_pages') {
      const { accountId } = requestData;
      if (!accountId) throw new Error('accountId é obrigatório');
      
      const pages = await fetchFacebookPages(accountId, accessToken);
      return new Response(
        JSON.stringify({ success: true, pages }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'create_audiences') {
      const { 
        accountId, 
        audienceType, 
        pixelId, 
        eventTypes,
        instagramAccountId,
        facebookPageId,
        engagementTypes
      } = requestData;

      if (!accountId || !audienceType) {
        throw new Error('accountId e audienceType são obrigatórios');
      }

      const results = [];
      let created = 0;
      let failed = 0;

      if (audienceType === 'site') {
        if (!pixelId || !eventTypes || eventTypes.length === 0) {
          throw new Error('pixelId e eventTypes são obrigatórios para públicos de site');
        }

        const siteRetentionDays = [7, 14, 30, 60, 90, 180];

        for (const eventType of eventTypes) {
          for (const days of siteRetentionDays) {
            try {
              const result = await createSiteAudience(accountId, pixelId, eventType, days, accessToken);
              results.push({
                name: `[SITE] ${eventType} - ${days}D`,
                status: 'success',
                audienceId: result.id
              });
              created++;
            } catch (error: any) {
              results.push({
                name: `[SITE] ${eventType} - ${days}D`,
                status: 'failed',
                error: error.message
              });
              failed++;
            }
          }
        }
      } else if (audienceType === 'engagement') {
        if (!engagementTypes || engagementTypes.length === 0) {
          throw new Error('engagementTypes é obrigatório para públicos de engajamento');
        }

        const engagementRetentionDays = [7, 14, 30, 60, 90, 180, 365, 730];

        for (const type of engagementTypes) {
          for (const days of engagementRetentionDays) {
            try {
              if (type === 'instagram' && instagramAccountId) {
                const result = await createEngagementAudience(
                  accountId,
                  instagramAccountId,
                  'instagram',
                  days,
                  accessToken
                );
                results.push({
                  name: `[IG] Envolvidos - ${days}D`,
                  status: 'success',
                  audienceId: result.id
                });
                created++;
              } else if (type === 'facebook' && facebookPageId) {
                const result = await createEngagementAudience(
                  accountId,
                  facebookPageId,
                  'facebook',
                  days,
                  accessToken
                );
                results.push({
                  name: `[FB] Envolvidos - ${days}D`,
                  status: 'success',
                  audienceId: result.id
                });
                created++;
              }
            } catch (error: any) {
              const name = type === 'instagram' 
                ? `[IG] Envolvidos - ${days}D`
                : `[FB] Envolvidos - ${days}D`;
              results.push({
                name,
                status: 'failed',
                error: error.message
              });
              failed++;
            }
          }
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          created,
          failed,
          audiences: results
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'create_unified_audiences') {
      const { 
        accountId, 
        pixelId,
        siteEvents,
        engagementTypes,
        instagramAccountId,
        facebookPageId
      } = requestData;

      if (!accountId) {
        throw new Error('accountId é obrigatório');
      }

      const results: any = {
        site: [],
        engagement: [],
        created: 0,
        failed: 0
      };

      const siteRetentionDays = [7, 14, 30, 60, 90, 180];
      const engagementRetentionDays = [7, 14, 30, 60, 90, 180, 365, 730];

      // Criar públicos de site se houver eventos
      if (siteEvents && siteEvents.length > 0 && pixelId) {
        for (const event of siteEvents) {
          for (const days of siteRetentionDays) {
            try {
              const result = await createSiteAudience(accountId, pixelId, event, days, accessToken);
              results.site.push({
                name: `[SITE] ${event} - ${days}D`,
                status: 'success',
                audienceId: result.id
              });
              results.created++;
            } catch (error: any) {
              results.site.push({
                name: `[SITE] ${event} - ${days}D`,
                status: 'failed',
                error: error.message
              });
              results.failed++;
            }
          }
        }
      }

      // Criar públicos de engajamento se houver tipos
      if (engagementTypes && engagementTypes.length > 0) {
        for (const type of engagementTypes) {
          for (const days of engagementRetentionDays) {
            try {
              if (type === 'instagram' && instagramAccountId) {
                const result = await createEngagementAudience(
                  accountId,
                  instagramAccountId,
                  'instagram',
                  days,
                  accessToken
                );
                results.engagement.push({
                  name: `[IG] Envolvidos - ${days}D`,
                  status: 'success',
                  audienceId: result.id
                });
                results.created++;
              } else if (type === 'facebook' && facebookPageId) {
                const result = await createEngagementAudience(
                  accountId,
                  facebookPageId,
                  'facebook',
                  days,
                  accessToken
                );
                results.engagement.push({
                  name: `[FB] Envolvidos - ${days}D`,
                  status: 'success',
                  audienceId: result.id
                });
                results.created++;
              }
            } catch (error: any) {
              const name = type === 'instagram' 
                ? `[IG] Envolvidos - ${days}D`
                : `[FB] Envolvidos - ${days}D`;
              results.engagement.push({
                name,
                status: 'failed',
                error: error.message
              });
              results.failed++;
            }
          }
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          created: results.created,
          failed: results.failed,
          audiences: [...results.site, ...results.engagement]
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Ação inválida');

  } catch (error: any) {
    console.error('[create-meta-audiences] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
