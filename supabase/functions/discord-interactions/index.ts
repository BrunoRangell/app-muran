// Discord Interactions endpoint para o slash command /anuncios
// Verifica assinatura Ed25519, processa o comando e devolve embeds com
// imagem + nome + status dos anúncios ativos do Meta Ads do cliente.

import { createClient } from 'npm:@supabase/supabase-js@2';
import nacl from 'npm:tweetnacl@1.0.3';

const META_API_VERSION = 'v24.0';
const MURAN_ORANGE = 0xff6e00;

// ============== Helpers ==============

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return out;
}

async function verifyDiscordSignature(req: Request, rawBody: string): Promise<boolean> {
  const signature = req.headers.get('x-signature-ed25519');
  const timestamp = req.headers.get('x-signature-timestamp');
  const publicKey = Deno.env.get('DISCORD_PUBLIC_KEY');
  if (!signature || !timestamp || !publicKey) return false;
  try {
    const message = new TextEncoder().encode(timestamp + rawBody);
    return nacl.sign.detached.verify(message, hexToBytes(signature), hexToBytes(publicKey));
  } catch (e) {
    console.error('[verify] erro', e);
    return false;
  }
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ============== Meta API ==============

async function fetchMetaAds(accountId: string, accessToken: string) {
  const fields = [
    'name',
    'effective_status',
    'campaign{name}',
    'creative{image_url,thumbnail_url,effective_object_story_id,object_story_spec}',
  ].join(',');

  const url =
    `https://graph.facebook.com/${META_API_VERSION}/act_${accountId}/ads` +
    `?effective_status=["ACTIVE"]&limit=50&fields=${encodeURIComponent(fields)}` +
    `&access_token=${encodeURIComponent(accessToken)}`;

  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) {
    console.error('[meta] erro', JSON.stringify(data));
    throw new Error(data?.error?.message || 'Falha ao buscar anúncios');
  }
  return data.data || [];
}

function resolveImageUrl(ad: any): string | null {
  const c = ad?.creative || {};
  if (c.image_url) return c.image_url;
  if (c.thumbnail_url) return c.thumbnail_url;
  const oss = c.object_story_spec || {};
  if (oss.link_data?.picture) return oss.link_data.picture;
  if (oss.video_data?.image_url) return oss.video_data.image_url;
  if (oss.photo_data?.url) return oss.photo_data.url;
  return null;
}

// ============== Followup (resposta diferida) ==============

async function sendFollowup(appId: string, token: string, payload: unknown) {
  const url = `https://discord.com/api/v10/webhooks/${appId}/${token}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) console.error('[followup]', res.status, await res.text());
}

async function editOriginal(appId: string, token: string, payload: unknown) {
  const url = `https://discord.com/api/v10/webhooks/${appId}/${token}/messages/@original`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) console.error('[edit]', res.status, await res.text());
}

// ============== Lógica do comando ==============

async function getMetaAccessToken(supabase: ReturnType<typeof createClient>): Promise<string> {
  const { data, error } = await supabase
    .from('api_tokens')
    .select('value')
    .eq('name', 'meta_access_token')
    .maybeSingle();
  if (error || !data?.value) throw new Error('Token Meta não configurado');
  return data.value as string;
}

async function findClientAccounts(
  supabase: ReturnType<typeof createClient>,
  nome: string,
) {
  const { data, error } = await supabase
    .from('client_accounts')
    .select('id, account_id, account_name, client_id, clients!inner(id, company_name, status)')
    .eq('platform', 'meta')
    .eq('status', 'active')
    .not('account_id', 'is', null)
    .neq('account_id', '')
    .ilike('clients.company_name', `%${nome}%`);

  if (error) throw error;
  return (data || []).filter((row: any) => row.clients?.status === 'active');
}

const APP_BASE_URL = 'https://app.muranmarketing.com.br';

function buildAdsMessage(clientId: string, clientName: string, accountName: string, accountRowId: string) {
  const url = `${APP_BASE_URL}/anuncios-ativos?client=${clientId}&account=${accountRowId}`;
  return {
    content:
      `📣 **${clientName}** — ${accountName}\n` +
      `Abra a página de anúncios ativos com galeria visual e exportação em PNG:\n` +
      url,
  };
}


async function handleAnunciosCommand(
  appId: string,
  token: string,
  nome: string,
  supabase: ReturnType<typeof createClient>,
) {
  try {
    const accounts = await findClientAccounts(supabase, nome);

    if (accounts.length === 0) {
      await editOriginal(appId, token, {
        content: `❌ Nenhum cliente ativo encontrado para **"${nome}"** com conta Meta configurada.`,
      });
      return;
    }

    if (accounts.length > 1) {
      // Menu de desambiguação (até 25 opções)
      const options = accounts.slice(0, 25).map((a: any) => ({
        label: `${a.clients.company_name}`.slice(0, 100),
        description: `Conta: ${a.account_name || a.account_id}`.slice(0, 100),
        value: a.id,
      }));
      await editOriginal(appId, token, {
        content: `Encontrei **${accounts.length}** contas para "${nome}". Escolha qual quer ver:`,
        components: [
          {
            type: 1,
            components: [
              {
                type: 3, // String select
                custom_id: 'select_anuncios_account',
                placeholder: 'Selecione a conta',
                options,
              },
            ],
          },
        ],
      });
      return;
    }

    const acc = accounts[0] as any;
    const accessToken = await getMetaAccessToken(supabase);
    const ads = await fetchMetaAds(acc.account_id, accessToken);
    const msg = buildAdsMessage(acc.clients.company_name, acc.account_name || acc.account_id, ads);
    await editOriginal(appId, token, msg);
  } catch (e: any) {
    console.error('[handle] erro', e);
    await editOriginal(appId, token, {
      content: `⚠️ Erro: ${e?.message || 'falha desconhecida'}`,
    });
  }
}

async function handleAccountSelect(
  appId: string,
  token: string,
  accountRowId: string,
  supabase: ReturnType<typeof createClient>,
) {
  try {
    const { data: acc, error } = await supabase
      .from('client_accounts')
      .select('account_id, account_name, clients!inner(company_name)')
      .eq('id', accountRowId)
      .maybeSingle();
    if (error || !acc) throw new Error('Conta não encontrada');

    const accessToken = await getMetaAccessToken(supabase);
    const ads = await fetchMetaAds((acc as any).account_id, accessToken);
    const msg = buildAdsMessage(
      (acc as any).clients.company_name,
      (acc as any).account_name || (acc as any).account_id,
      ads,
    );
    await editOriginal(appId, token, { ...msg, components: [] });
  } catch (e: any) {
    console.error('[select] erro', e);
    await editOriginal(appId, token, {
      content: `⚠️ Erro: ${e?.message || 'falha desconhecida'}`,
      components: [],
    });
  }
}

// ============== Handler principal ==============

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const rawBody = await req.text();
  const valid = await verifyDiscordSignature(req, rawBody);
  if (!valid) {
    return new Response('invalid request signature', { status: 401 });
  }

  const interaction = JSON.parse(rawBody);
  const appId = Deno.env.get('DISCORD_APPLICATION_ID')!;

  // PING
  if (interaction.type === 1) {
    return jsonResponse({ type: 1 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // APPLICATION_COMMAND
  if (interaction.type === 2) {
    const name = interaction.data?.name;
    const token = interaction.token;

    if (name === 'anuncios') {
      const cliente = (interaction.data?.options || []).find((o: any) => o.name === 'cliente')?.value || '';
      // Resposta diferida (efêmera) — depois editamos via webhook
      // @ts-ignore — runtime Deno
      EdgeRuntime.waitUntil(handleAnunciosCommand(appId, token, String(cliente), supabase));
      return jsonResponse({
        type: 5,
        data: { flags: 64 }, // ephemeral
      });
    }

    return jsonResponse({
      type: 4,
      data: { content: 'Comando não reconhecido', flags: 64 },
    });
  }

  // MESSAGE_COMPONENT
  if (interaction.type === 3) {
    const customId = interaction.data?.custom_id;
    const token = interaction.token;

    if (customId === 'select_anuncios_account') {
      const accountRowId = interaction.data?.values?.[0];
      // @ts-ignore
      EdgeRuntime.waitUntil(handleAccountSelect(appId, token, accountRowId, supabase));
      return jsonResponse({ type: 6 }); // DEFERRED_UPDATE_MESSAGE
    }
  }

  return jsonResponse({ type: 4, data: { content: 'Não entendi', flags: 64 } });
});
