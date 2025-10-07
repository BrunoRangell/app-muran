import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

const GRAPH_API_VERSION = 'v21.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

interface CreateAudienceRequest {
  action: 'fetch_accounts' | 'fetch_pixels' | 'fetch_instagram_accounts' | 'fetch_facebook_pages' | 'create_audiences';
  accountId?: string;
  audienceType?: 'site' | 'engagement';
  pixelId?: string;
  eventTypes?: string[];
  instagramAccountId?: string;
  facebookPageId?: string;
  engagementTypes?: string[];
}

// Função para buscar o token Meta do banco de dados
async function getMetaAccessToken(supabase: any): Promise<string> {
  const { data, error } = await supabase
    .from('api_tokens')
    .select('value')
    .eq('name', 'META_ADS_ACCESS_TOKEN')
    .single();

  if (error || !data) {
    throw new Error('Token Meta Ads não encontrado no banco de dados');
  }

  return data.value;
}

// Buscar contas de anúncios
async function fetchAdAccounts(accessToken: string) {
  const url = `${GRAPH_API_BASE}/me/adaccounts?fields=id,name,account_status&access_token=${accessToken}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erro ao buscar contas: ${error}`);
  }

  const data = await response.json();
  return data.data || [];
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
  const url = `${GRAPH_API_BASE}/${accountId}?fields=instagram_accounts{id,name,username}&access_token=${accessToken}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erro ao buscar perfis Instagram: ${error}`);
  }

  const data = await response.json();
  return data.instagram_accounts?.data || [];
}

// Buscar páginas Facebook
async function fetchFacebookPages(accountId: string, accessToken: string) {
  const url = `${GRAPH_API_BASE}/${accountId}?fields=pages{id,name}&access_token=${accessToken}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erro ao buscar páginas Facebook: ${error}`);
  }

  const data = await response.json();
  return data.pages?.data || [];
}

// Criar público de site
async function createSiteAudience(
  accountId: string,
  pixelId: string,
  eventType: string,
  accessToken: string
) {
  const retentionDays = 180;
  const audienceName = `${eventType} - Últimos ${retentionDays} dias`;
  
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
  accessToken: string
) {
  const retentionDays = 365;
  const audienceName = sourceType === 'instagram' 
    ? `Instagram - Envolvimento ${retentionDays} dias`
    : `Facebook - Envolvimento ${retentionDays} dias`;
  
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

    if (action === 'fetch_accounts') {
      const accounts = await fetchAdAccounts(accessToken);
      return new Response(
        JSON.stringify({ success: true, accounts }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

        for (const eventType of eventTypes) {
          try {
            const result = await createSiteAudience(accountId, pixelId, eventType, accessToken);
            results.push({
              name: `${eventType} - Últimos 180 dias`,
              status: 'success',
              audienceId: result.id
            });
            created++;
          } catch (error: any) {
            results.push({
              name: `${eventType} - Últimos 180 dias`,
              status: 'failed',
              error: error.message
            });
            failed++;
          }
        }
      } else if (audienceType === 'engagement') {
        if (!engagementTypes || engagementTypes.length === 0) {
          throw new Error('engagementTypes é obrigatório para públicos de engajamento');
        }

        for (const type of engagementTypes) {
          try {
            if (type === 'instagram' && instagramAccountId) {
              const result = await createEngagementAudience(
                accountId,
                instagramAccountId,
                'instagram',
                accessToken
              );
              results.push({
                name: 'Instagram - Envolvimento 365 dias',
                status: 'success',
                audienceId: result.id
              });
              created++;
            } else if (type === 'facebook' && facebookPageId) {
              const result = await createEngagementAudience(
                accountId,
                facebookPageId,
                'facebook',
                accessToken
              );
              results.push({
                name: 'Facebook - Envolvimento 365 dias',
                status: 'success',
                audienceId: result.id
              });
              created++;
            }
          } catch (error: any) {
            const name = type === 'instagram' 
              ? 'Instagram - Envolvimento 365 dias'
              : 'Facebook - Envolvimento 365 dias';
            results.push({
              name,
              status: 'failed',
              error: error.message
            });
            failed++;
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
