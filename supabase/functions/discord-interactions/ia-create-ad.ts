// Wizard de criação de anúncio novo dentro de um adset existente (Meta Ads).
// Máquina de estados armazenada em bot_action_requests.status + .creative_draft (jsonb).
//
// Estados:
//   draft_image_source        → mostra 3 botões (upload / drive / instagram)
//   awaiting_image_upload     → aguarda Message Command "Usar como imagem do anúncio"
//   awaiting_drive_link       → modal drive submetido → processa
//   awaiting_instagram_link   → modal IG submetido → processa
//   awaiting_page_pick        → múltiplas pages promovíveis → select
//   draft_copy                → aguarda modal de copy (nome/texto/título/link/CTA)
//   awaiting_cta_pick         → CTA não mapeado → select fallback
//   pending                   → embed final de confirmação (reaproveita ia_confirm)
//   executed / failed / cancelled

import { createClient } from 'npm:@supabase/supabase-js@2';

const META_API_VERSION = 'v24.0';
const MURAN_ORANGE = 0xff6e00;

// ============= Erro customizado com detalhe técnico da Meta =============

export class MetaApiError extends Error {
  detail: any;
  constructor(message: string, detail: any) {
    super(message);
    this.name = 'MetaApiError';
    this.detail = detail;
  }
}

// ============= Helpers de resposta =============

export async function editOriginal(appId: string, token: string, payload: unknown) {
  const url = `https://discord.com/api/v10/webhooks/${appId}/${token}/messages/@original`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) console.error('[create-ad editOriginal]', res.status, await res.text());
}

async function sendFollowup(appId: string, token: string, payload: unknown) {
  const url = `https://discord.com/api/v10/webhooks/${appId}/${token}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) console.error('[create-ad followup]', res.status, await res.text());
}

// Edita uma mensagem arbitrária usando o BOT TOKEN (necessário quando o token de interação do wizard
// já foi consumido/expirou — típico do fluxo Message Command).
async function editMessageWithBotToken(channelId: string, messageId: string, payload: unknown) {
  const bot = Deno.env.get('DISCORD_TOKEN');
  if (!bot) return;
  const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bot ${bot}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) console.error('[create-ad editWithBot]', res.status, await res.text());
}

// ============= Meta helpers =============

async function getMetaToken(supabase: ReturnType<typeof createClient>): Promise<string> {
  const { data } = await supabase.from('api_tokens').select('value').eq('name', 'meta_access_token').maybeSingle();
  if (!data?.value) throw new Error('Token Meta não configurado');
  return data.value as string;
}

async function fetchAdsetContext(accountId: string, adsetId: string, token: string) {
  const url =
    `https://graph.facebook.com/${META_API_VERSION}/${adsetId}` +
    `?fields=id,name,campaign{id,name},account_id` +
    `&access_token=${encodeURIComponent(token)}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `Falha ao buscar adset (${res.status})`);
  return data;
}

async function fetchPromotePages(accountId: string, token: string): Promise<Array<{ id: string; name: string }>> {
  const url =
    `https://graph.facebook.com/${META_API_VERSION}/act_${accountId}/promote_pages` +
    `?fields=id,name&limit=25&access_token=${encodeURIComponent(token)}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) {
    console.error('[promote_pages]', data);
    throw new Error(data?.error?.message || `Falha ao listar páginas promovíveis (${res.status})`);
  }
  return (data.data || []).map((p: any) => ({ id: p.id, name: p.name }));
}

async function uploadImageToMetaAdImages(
  accountId: string,
  token: string,
  imageBytes: ArrayBuffer,
  filename: string,
): Promise<{ hash: string; url?: string }> {
  const form = new FormData();
  const blob = new Blob([imageBytes]);
  form.append(filename, blob, filename);
  form.append('access_token', token);

  const res = await fetch(
    `https://graph.facebook.com/${META_API_VERSION}/act_${accountId}/adimages`,
    { method: 'POST', body: form },
  );
  const data = await res.json();
  if (!res.ok) {
    console.error('[adimages upload]', data);
    throw new MetaApiError(data?.error?.message || `Falha ao subir imagem para Meta (${res.status})`, data?.error || null);
  }
  // Resposta: { "images": { "<filename>": { "hash": "...", "url": "..." } } }
  const imgs = data?.images || {};
  const first: any = Object.values(imgs)[0];
  if (!first?.hash) throw new Error('Meta não retornou hash da imagem.');
  return { hash: first.hash, url: first.url };
}

async function createAdCreative(
  accountId: string,
  token: string,
  spec: {
    name: string;
    page_id: string;
    message: string;
    link: string;
    image_hash: string;
    headline?: string;
    description?: string;
    cta_type?: string;
  },
): Promise<string> {
  const link_data: any = {
    message: spec.message,
    link: spec.link,
    image_hash: spec.image_hash,
  };
  if (spec.headline) link_data.name = spec.headline;
  if (spec.description) link_data.description = spec.description;
  if (spec.cta_type && spec.cta_type !== 'NO_BUTTON') {
    link_data.call_to_action = { type: spec.cta_type, value: { link: spec.link } };
  }

  const body = new URLSearchParams({
    name: spec.name,
    object_story_spec: JSON.stringify({ page_id: spec.page_id, link_data }),
    degrees_of_freedom_spec: JSON.stringify({ creative_features_spec: { standard_enhancements: { enroll_status: 'OPT_OUT' } } }),
    access_token: token,
  });

  const res = await fetch(`https://graph.facebook.com/${META_API_VERSION}/act_${accountId}/adcreatives`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = await res.json();
  if (!res.ok) {
    console.error('[adcreatives]', data);
    throw new MetaApiError(data?.error?.message || `Falha ao criar creative (${res.status})`, data?.error || null);
  }
  return data.id as string;
}

async function createAd(
  accountId: string,
  token: string,
  spec: { name: string; adset_id: string; creative_id: string; status: 'ACTIVE' | 'PAUSED' },
): Promise<string> {
  const body = new URLSearchParams({
    name: spec.name,
    adset_id: spec.adset_id,
    creative: JSON.stringify({ creative_id: spec.creative_id }),
    status: spec.status,
    access_token: token,
  });
  const res = await fetch(`https://graph.facebook.com/${META_API_VERSION}/act_${accountId}/ads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = await res.json();
  if (!res.ok) {
    console.error('[ads create]', data);
    throw new MetaApiError(data?.error?.message || `Falha ao criar anúncio (${res.status})`, data?.error || null);
  }
  return data.id as string;
}

// ============= CTA mapping =============

const CTA_KEYWORDS: Array<[RegExp, string]> = [
  [/\b(comprar|comprar agora|shop)\b/i, 'SHOP_NOW'],
  [/\b(saiba mais|learn more|leia mais|conheca|conheça)\b/i, 'LEARN_MORE'],
  [/\b(cadastr|inscrev|sign ?up)\b/i, 'SIGN_UP'],
  [/\b(assinar|subscribe)\b/i, 'SUBSCRIBE'],
  [/\b(baixar|download)\b/i, 'DOWNLOAD'],
  [/\b(oferta|get offer|resgatar)\b/i, 'GET_OFFER'],
  [/\b(fale conosco|contat|contact)\b/i, 'CONTACT_US'],
  [/\b(mensag|message|whats)\b/i, 'WHATSAPP_MESSAGE'],
  [/\b(instalar|install)\b/i, 'INSTALL_MOBILE_APP'],
  [/\b(jogar|play)\b/i, 'PLAY_GAME'],
  [/\b(reservar|book)\b/i, 'BOOK_TRAVEL'],
  [/\b(pedir|order)\b/i, 'ORDER_NOW'],
  [/\b(doar|donate)\b/i, 'DONATE_NOW'],
  [/\b(candidat|apply)\b/i, 'APPLY_NOW'],
  [/\b(or[çc]amento|get quote|cota[çc]|cotacao)\b/i, 'GET_QUOTE'],
  [/\b(ouvir|listen)\b/i, 'LISTEN_MUSIC'],
  [/\b(assistir|ver v[ií]deo|watch)\b/i, 'WATCH_VIDEO'],
  [/\b(sem bot[aã]o|no button|nenhum)\b/i, 'NO_BUTTON'],
];

function mapCta(freeText: string | null | undefined): { type: string | null; confident: boolean } {
  if (!freeText) return { type: null, confident: false };
  const t = freeText.trim();
  if (!t) return { type: null, confident: false };
  // Se veio já em UPPERCASE_TIPO
  if (/^[A-Z_]+$/.test(t)) return { type: t, confident: true };
  for (const [rx, type] of CTA_KEYWORDS) {
    if (rx.test(t)) return { type, confident: true };
  }
  return { type: null, confident: false };
}

const CTA_OPTIONS: Array<{ label: string; value: string }> = [
  { label: 'Comprar agora (SHOP_NOW)', value: 'SHOP_NOW' },
  { label: 'Saiba mais (LEARN_MORE)', value: 'LEARN_MORE' },
  { label: 'Cadastre-se (SIGN_UP)', value: 'SIGN_UP' },
  { label: 'Enviar mensagem WhatsApp (WHATSAPP_MESSAGE)', value: 'WHATSAPP_MESSAGE' },
  { label: 'Fale conosco (CONTACT_US)', value: 'CONTACT_US' },
  { label: 'Baixar (DOWNLOAD)', value: 'DOWNLOAD' },
  { label: 'Reservar (BOOK_TRAVEL)', value: 'BOOK_TRAVEL' },
  { label: 'Pedir agora (ORDER_NOW)', value: 'ORDER_NOW' },
  { label: 'Solicitar orçamento (GET_QUOTE)', value: 'GET_QUOTE' },
  { label: 'Ver oferta (GET_OFFER)', value: 'GET_OFFER' },
  { label: 'Assinar (SUBSCRIBE)', value: 'SUBSCRIBE' },
  { label: 'Assistir vídeo (WATCH_VIDEO)', value: 'WATCH_VIDEO' },
  { label: 'Sem botão (NO_BUTTON)', value: 'NO_BUTTON' },
];

// ============= FLOW: início =============

export type CreateAdStartInput = {
  clientId: string;
  clientName: string;
  discordUser: string;
  channelId: string;
  comando: string;
  adsetTargetId: string; // id numérico Meta do adset
  adsetName: string;
  accountId: string;
  hierarchy?: { campaign_id?: string; campaign_name?: string; adset_id?: string; adset_name?: string };
  statusInicial: 'ativo' | 'pausado';
};

export async function startCreateAdFlow(
  supabase: ReturnType<typeof createClient>,
  appId: string,
  interactionToken: string,
  input: CreateAdStartInput,
) {
  const draft = {
    account_id: input.accountId,
    adset_id: input.adsetTargetId,
    adset_name: input.adsetName,
    campaign_id: input.hierarchy?.campaign_id,
    campaign_name: input.hierarchy?.campaign_name,
    status_inicial: input.statusInicial,
    source: null as null | 'upload' | 'drive' | 'instagram',
    image_hash: null,
    image_preview_url: null,
    source_instagram_media_id: null,
    page_id: null,
    name: null,
    message: null,
    headline: null,
    description: null,
    link: null,
    cta_type: null,
  };

  const { data: inserted, error } = await supabase
    .from('bot_action_requests')
    .insert({
      client_id: input.clientId,
      platform: 'meta',
      level: 'adset',
      target_id: input.adsetTargetId,
      target_name: input.adsetName,
      action: 'criar_anuncio',
      comando: input.comando,
      requested_by_discord_user: input.discordUser,
      channel_id: input.channelId,
      hierarchy_snapshot: input.hierarchy || null,
      creative_draft: draft,
      status: 'draft_image_source',
    })
    .select('id')
    .single();

  if (error || !inserted) {
    console.error('[create-ad start]', error);
    await editOriginal(appId, interactionToken, {
      content: `⚠️ Erro ao iniciar criação de anúncio: ${error?.message || 'desconhecido'}`,
    });
    return;
  }

  await editOriginal(appId, interactionToken, buildImageSourcePayload(input, inserted.id));
}

function buildImageSourcePayload(input: CreateAdStartInput, reqId: string) {
  const path =
    (input.hierarchy?.campaign_name ? `**Campanha:** ${input.hierarchy.campaign_name}\n` : '') +
    `**Conjunto:** ${input.adsetName}`;
  const statusLine =
    input.statusInicial === 'ativo'
      ? '🟢 Vai nascer **ativo** (o usuário pediu explicitamente).'
      : '⏸️ Vai nascer **pausado** por padrão (peça "ativo" no comando para mudar).';
  return {
    content: '',
    embeds: [
      {
        title: '📣 Criar novo anúncio — escolha a fonte da imagem',
        description: `${path}\n\n${statusLine}\n\nDe onde vem a imagem/mídia do anúncio?`,
        color: MURAN_ORANGE,
        fields: [{ name: 'Cliente', value: input.clientName, inline: true }],
        footer: { text: `Solicitado por ${input.discordUser}` },
      },
    ],
    components: [
      {
        type: 1,
        components: [
          { type: 2, style: 1, label: '📤 Novo upload', custom_id: `ia_create_src:${reqId}:upload` },
          { type: 2, style: 2, label: '🔗 Link do Drive', custom_id: `ia_create_src:${reqId}:drive` },
          { type: 2, style: 2, label: '📷 Post do Instagram', custom_id: `ia_create_src:${reqId}:instagram` },
        ],
      },
      {
        type: 1,
        components: [
          { type: 2, style: 4, label: '❌ Cancelar', custom_id: `ia_cancel:${reqId}` },
        ],
      },
    ],
  };
}

// ============= FLOW: clique em botão de fonte =============
// Chamado de index.ts. Para "upload": editamos a mensagem via editOriginal (ok, mesma interação).
// Para "drive"/"instagram": retornamos payload de MODAL (type=9) síncrono de index.ts.

export function buildDriveModal(reqId: string, errorHint?: string) {
  return {
    type: 9,
    data: {
      custom_id: `ia_create_drive_modal:${reqId}`,
      title: 'Link do Google Drive',
      components: [
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: 'drive_link',
              style: 1,
              label: errorHint || 'URL da imagem (Google Drive)',
              placeholder: 'https://drive.google.com/file/d/.../view',
              required: true,
              min_length: 10,
              max_length: 500,
            },
          ],
        },
      ],
    },
  };
}

export function buildInstagramModal(reqId: string, errorHint?: string) {
  return {
    type: 9,
    data: {
      custom_id: `ia_create_ig_modal:${reqId}`,
      title: 'Link do post do Instagram',
      components: [
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: 'ig_link',
              style: 1,
              label: errorHint || 'URL do post do Instagram',
              placeholder: 'https://www.instagram.com/p/SHORTCODE/',
              required: true,
              min_length: 10,
              max_length: 500,
            },
          ],
        },
      ],
    },
  };
}

export async function handleImageSourceClick(
  supabase: ReturnType<typeof createClient>,
  appId: string,
  interactionToken: string,
  customId: string,
  interactionMessage: { id: string; channel_id: string } | null,
) {
  // custom_id: ia_create_src:<reqId>:<source>
  const parts = customId.split(':');
  const reqId = parts[1];
  const source = parts[2] as 'upload' | 'drive' | 'instagram';

  const { data: row } = await supabase
    .from('bot_action_requests')
    .select('*')
    .eq('id', reqId)
    .maybeSingle();

  if (!row || row.status !== 'draft_image_source') {
    await editOriginal(appId, interactionToken, {
      content: `ℹ️ Este wizard já não está esperando a escolha de fonte (status: ${row?.status || 'inexistente'}).`,
      components: [],
      embeds: [],
    });
    return;
  }

  if (source === 'upload') {
    const draft = { ...(row.creative_draft || {}), source: 'upload' };
    // Guardamos o id da MENSAGEM do wizard para editá-la depois via bot token, quando o Message Command chegar.
    const wizardMsg = interactionMessage
      ? { message_id: interactionMessage.id, channel_id: interactionMessage.channel_id }
      : null;
    await supabase
      .from('bot_action_requests')
      .update({
        status: 'awaiting_image_upload',
        creative_draft: { ...draft, wizard_message: wizardMsg },
      })
      .eq('id', reqId);

    await editOriginal(appId, interactionToken, {
      content: '',
      embeds: [
        {
          title: '📤 Envie a imagem do anúncio',
          description:
            '1) Poste a imagem **neste canal** como uma mensagem normal.\n' +
            '2) Depois clique **com o botão direito** (ou segure, no mobile) na sua própria mensagem → **Apps** → **Usar como imagem do anúncio**.\n\n' +
            '_A imagem será enviada automaticamente para o Meta e o wizard continuará._',
          color: MURAN_ORANGE,
        },
      ],
      components: [
        { type: 1, components: [{ type: 2, style: 4, label: '❌ Cancelar', custom_id: `ia_cancel:${reqId}` }] },
      ],
    });
    return;
  }

  // drive / instagram: o modal é retornado SÍNCRONO por index.ts.
  // Aqui não deveríamos ser chamados nesses casos (index.ts trata separado).
}

// ============= Message Command: "Usar como imagem do anúncio" =============

export async function handleMessageAttachImage(
  supabase: ReturnType<typeof createClient>,
  appId: string,
  interactionToken: string,
  interaction: any,
) {
  try {
    const channelId: string = interaction.channel_id || interaction.channel?.id || '';
    const user: string =
      interaction.member?.user?.username ||
      interaction.user?.username ||
      interaction.member?.user?.global_name ||
      '';

    if (!channelId || !user) {
      await sendFollowup(appId, interactionToken, {
        content: '❌ Não consegui identificar canal/usuário.',
        flags: 64,
      });
      return;
    }

    // Achar a solicitação `awaiting_image_upload` mais recente deste par (canal + usuário), na última 1h.
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: rows, error } = await supabase
      .from('bot_action_requests')
      .select('*')
      .eq('status', 'awaiting_image_upload')
      .eq('channel_id', channelId)
      .eq('requested_by_discord_user', user)
      .gte('created_at', oneHourAgo)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !rows?.length) {
      await sendFollowup(appId, interactionToken, {
        content:
          '❌ Não encontrei nenhum wizard de criação de anúncio esperando imagem neste canal (para você, na última hora).\n' +
          'Rode `/ia criar novo anúncio no conjunto ...` primeiro e clique em **📤 Novo upload**.',
        flags: 64,
      });
      return;
    }

    const row = rows[0];

    // Extrair mensagem selecionada e o primeiro anexo de imagem
    const targetMessageId: string | undefined = interaction.data?.target_id;
    const resolvedMsg =
      (interaction.data?.resolved?.messages || {})[targetMessageId || ''] || null;
    const attachments: any[] = resolvedMsg?.attachments || [];
    const imgAtt = attachments.find((a) => {
      const ct = (a.content_type || '').toLowerCase();
      return ct.startsWith('image/');
    });

    if (!imgAtt?.url) {
      await sendFollowup(appId, interactionToken, {
        content: '❌ A mensagem selecionada não tem nenhum anexo de imagem. Poste uma foto e tente de novo.',
        flags: 64,
      });
      return;
    }

    // Baixar imagem
    const imgRes = await fetch(imgAtt.url);
    if (!imgRes.ok) {
      await sendFollowup(appId, interactionToken, {
        content: `❌ Falha ao baixar a imagem do Discord (${imgRes.status}).`,
        flags: 64,
      });
      return;
    }
    const imgBytes = await imgRes.arrayBuffer();
    const filename = (imgAtt.filename || 'anuncio.jpg').replace(/[^\w.\-]/g, '_');

    // Subir para Meta /adimages
    const draft = row.creative_draft || {};
    const accountId: string = draft.account_id;
    if (!accountId) {
      await sendFollowup(appId, interactionToken, { content: '❌ account_id perdido no rascunho.', flags: 64 });
      return;
    }
    const token = await getMetaToken(supabase);
    const { hash, url: previewUrl } = await uploadImageToMetaAdImages(accountId, token, imgBytes, filename);

    // Avançar rascunho
    const newDraft = { ...draft, source: 'upload', image_hash: hash, image_preview_url: previewUrl || imgAtt.url };
    await supabase
      .from('bot_action_requests')
      .update({ status: 'draft_copy', creative_draft: newDraft })
      .eq('id', row.id);

    // Feedback rápido (ephemeral) — depois iremos abrir o modal na PRÓXIMA interação (não podemos abrir modal fora de um clique)
    await sendFollowup(appId, interactionToken, {
      content: '',
      embeds: [
        {
          title: '✅ Imagem recebida e enviada ao Meta',
          description:
            'Agora clique em **📝 Preencher texto do anúncio** para informar nome, texto, título, link e CTA.',
          color: MURAN_ORANGE,
          image: { url: previewUrl || imgAtt.url },
        },
      ],
      components: [
        {
          type: 1,
          components: [
            { type: 2, style: 1, label: '📝 Preencher texto do anúncio', custom_id: `ia_create_open_copy:${row.id}` },
            { type: 2, style: 4, label: '❌ Cancelar', custom_id: `ia_cancel:${row.id}` },
          ],
        },
      ],
      flags: 64,
    });

    // Atualizar a mensagem original do wizard (via bot token — o token daquela interação já expirou)
    const wizardMsg = draft.wizard_message;
    if (wizardMsg?.message_id && wizardMsg?.channel_id) {
      await editMessageWithBotToken(wizardMsg.channel_id, wizardMsg.message_id, {
        content: '',
        embeds: [
          {
            title: '✅ Imagem carregada',
            description:
              `**Conjunto:** ${draft.adset_name}\n\nContinue no bloco abaixo (mensagem particular) clicando em **📝 Preencher texto do anúncio**.`,
            color: MURAN_ORANGE,
          },
        ],
        components: [],
      });
    }
  } catch (e: any) {
    console.error('[handleMessageAttachImage]', e);
    await sendFollowup(appId, interactionToken, {
      content: `⚠️ Erro: ${e?.message || 'falha desconhecida'}`,
      flags: 64,
    });
  }
}

// ============= Modal de copy =============

export function buildCopyModal(reqId: string) {
  return {
    type: 9,
    data: {
      custom_id: `ia_create_copy_modal:${reqId}`,
      title: 'Texto do anúncio',
      components: [
        {
          type: 1,
          components: [
            {
              type: 4, custom_id: 'ad_name', style: 1, label: 'Nome do anúncio',
              placeholder: 'Ex: AD12 - Promo Julho', required: true, min_length: 1, max_length: 200,
            },
          ],
        },
        {
          type: 1,
          components: [
            {
              type: 4, custom_id: 'ad_message', style: 2, label: 'Texto principal (message)',
              placeholder: 'Texto que aparece acima da imagem', required: true, min_length: 1, max_length: 2000,
            },
          ],
        },
        {
          type: 1,
          components: [
            {
              type: 4, custom_id: 'ad_headline', style: 1, label: 'Título (headline, opcional)',
              placeholder: 'Ex: Frete grátis hoje!', required: false, max_length: 250,
            },
          ],
        },
        {
          type: 1,
          components: [
            {
              type: 4, custom_id: 'ad_link', style: 1, label: 'Link de destino',
              placeholder: 'https://...', required: true, min_length: 4, max_length: 500,
            },
          ],
        },
        {
          type: 1,
          components: [
            {
              type: 4, custom_id: 'ad_cta', style: 1, label: 'CTA (ex: "comprar agora", "saiba mais")',
              placeholder: 'Deixe vazio para nenhum botão', required: false, max_length: 60,
            },
          ],
        },
      ],
    },
  };
}

export async function handleCopyModalSubmit(
  supabase: ReturnType<typeof createClient>,
  appId: string,
  interactionToken: string,
  customId: string,
  interactionData: any,
) {
  const [, reqId] = customId.split(':');
  const fields: Record<string, string> = {};
  for (const r of interactionData?.components || []) {
    for (const c of r.components || []) {
      fields[c.custom_id] = c.value || '';
    }
  }

  const { data: row } = await supabase
    .from('bot_action_requests').select('*').eq('id', reqId).maybeSingle();
  if (!row || row.status !== 'draft_copy') {
    await sendFollowup(appId, interactionToken, {
      content: `ℹ️ Este wizard não está esperando o texto (status: ${row?.status || 'inexistente'}).`,
      flags: 64,
    });
    return;
  }

  const link = (fields.ad_link || '').trim();
  if (!/^https?:\/\//i.test(link)) {
    await sendFollowup(appId, interactionToken, {
      content: '❌ Link de destino inválido. Deve começar com http(s)://. Clique novamente em **📝 Preencher texto do anúncio**.',
      flags: 64,
    });
    return;
  }

  const cta = mapCta(fields.ad_cta);
  const draft = row.creative_draft || {};
  const newDraft = {
    ...draft,
    name: fields.ad_name?.trim() || draft.adset_name,
    message: fields.ad_message?.trim() || '',
    headline: fields.ad_headline?.trim() || null,
    link,
    cta_free_text: fields.ad_cta?.trim() || null,
    cta_type: cta.type,
  };

  // Se CTA não foi mapeado, pedir escolha via select
  if (fields.ad_cta && !cta.type) {
    await supabase.from('bot_action_requests')
      .update({ creative_draft: newDraft, status: 'awaiting_cta_pick' })
      .eq('id', reqId);
    await sendFollowup(appId, interactionToken, {
      content: `🤔 Não consegui mapear o CTA "${fields.ad_cta}" pra um tipo válido da Meta. Escolha um da lista:`,
      components: [
        {
          type: 1,
          components: [
            {
              type: 3, custom_id: `ia_create_cta_pick:${reqId}`, placeholder: 'Selecione o CTA',
              options: CTA_OPTIONS.slice(0, 25),
            },
          ],
        },
      ],
      flags: 64,
    });
    return;
  }

  await supabase.from('bot_action_requests')
    .update({ creative_draft: newDraft }).eq('id', reqId);

  await advanceAfterCopy(supabase, appId, interactionToken, reqId);
}

export async function handleCtaPick(
  supabase: ReturnType<typeof createClient>,
  appId: string,
  interactionToken: string,
  customId: string,
  interactionData: any,
) {
  const [, reqId] = customId.split(':');
  const chosen = interactionData?.values?.[0];
  const { data: row } = await supabase
    .from('bot_action_requests').select('*').eq('id', reqId).maybeSingle();
  if (!row) return;
  const draft = { ...(row.creative_draft || {}), cta_type: chosen };
  await supabase.from('bot_action_requests').update({ creative_draft: draft }).eq('id', reqId);
  await advanceAfterCopy(supabase, appId, interactionToken, reqId);
}

async function advanceAfterCopy(
  supabase: ReturnType<typeof createClient>,
  appId: string,
  interactionToken: string,
  reqId: string,
) {
  const { data: row } = await supabase
    .from('bot_action_requests').select('*').eq('id', reqId).maybeSingle();
  if (!row) return;
  const draft = row.creative_draft || {};

  // Descobrir/escolher page_id se ainda não foi definido
  if (!draft.page_id) {
    try {
      const token = await getMetaToken(supabase);
      const pages = await fetchPromotePages(draft.account_id, token);
      if (pages.length === 0) {
        await failWizard(supabase, appId, interactionToken, reqId,
          '❌ Nenhuma Página promovível encontrada nesta conta Meta. Verifique as configurações de página do Business Manager.');
        return;
      }
      if (pages.length === 1) {
        draft.page_id = pages[0].id;
        draft.page_name = pages[0].name;
        await supabase.from('bot_action_requests').update({ creative_draft: draft }).eq('id', reqId);
      } else {
        await supabase.from('bot_action_requests')
          .update({ creative_draft: draft, status: 'awaiting_page_pick' }).eq('id', reqId);
        await sendFollowup(appId, interactionToken, {
          content: '📄 Esta conta tem mais de uma Página. Qual usar como identidade do anúncio?',
          components: [
            {
              type: 1, components: [{
                type: 3, custom_id: `ia_create_page_pick:${reqId}`, placeholder: 'Selecione a página',
                options: pages.slice(0, 25).map((p) => ({ label: p.name.slice(0, 100), value: p.id })),
              }],
            },
          ],
          flags: 64,
        });
        return;
      }
    } catch (e: any) {
      await failWizard(supabase, appId, interactionToken, reqId, `❌ ${e?.message || 'Falha ao listar páginas'}`);
      return;
    }
  }

  await showFinalConfirmation(supabase, appId, interactionToken, reqId);
}

export async function handlePagePick(
  supabase: ReturnType<typeof createClient>,
  appId: string,
  interactionToken: string,
  customId: string,
  interactionData: any,
) {
  const [, reqId] = customId.split(':');
  const chosen = interactionData?.values?.[0];
  const { data: row } = await supabase
    .from('bot_action_requests').select('*').eq('id', reqId).maybeSingle();
  if (!row) return;
  const draft = { ...(row.creative_draft || {}), page_id: chosen };
  await supabase.from('bot_action_requests').update({ creative_draft: draft }).eq('id', reqId);
  await showFinalConfirmation(supabase, appId, interactionToken, reqId);
}

async function showFinalConfirmation(
  supabase: ReturnType<typeof createClient>,
  appId: string,
  interactionToken: string,
  reqId: string,
) {
  const { data: row } = await supabase
    .from('bot_action_requests').select('*').eq('id', reqId).maybeSingle();
  if (!row) return;
  const draft = row.creative_draft || {};

  await supabase.from('bot_action_requests').update({ status: 'pending' }).eq('id', reqId);

  const statusIni = draft.status_inicial === 'ativo' ? 'ACTIVE' : 'PAUSED';
  const path =
    (draft.campaign_name ? `**Campanha:** ${draft.campaign_name}\n` : '') +
    `**Conjunto:** ${draft.adset_name}`;

  const payload = {
    content: '',
    embeds: [
      {
        title: '🤖 Confirmação — criar novo anúncio',
        description:
          `${path}\n\n` +
          `**Nome:** ${draft.name}\n` +
          `**Texto:** ${(draft.message || '').slice(0, 400)}${(draft.message || '').length > 400 ? '…' : ''}\n` +
          (draft.headline ? `**Título:** ${draft.headline}\n` : '') +
          `**Link:** ${draft.link}\n` +
          `**CTA:** ${draft.cta_type || 'sem botão'}\n` +
          `**Página:** ${draft.page_name || draft.page_id}\n` +
          `**Status inicial:** \`${statusIni}\``,
        color: MURAN_ORANGE,
        image: draft.image_preview_url ? { url: draft.image_preview_url } : undefined,
        footer: { text: `Solicitado por ${row.requested_by_discord_user || 'gestor'}` },
      },
    ],
    components: [
      {
        type: 1,
        components: [
          { type: 2, style: 3, label: '✅ Confirmar e criar', custom_id: `ia_confirm:${reqId}` },
          { type: 2, style: 4, label: '❌ Cancelar', custom_id: `ia_cancel:${reqId}` },
        ],
      },
    ],
  };
  // Confirmação vai como novo followup (ephemeral) — a mensagem original do wizard está antiga demais.
  await sendFollowup(appId, interactionToken, { ...payload, flags: 64 });
}

async function failWizard(
  supabase: ReturnType<typeof createClient>,
  appId: string,
  interactionToken: string,
  reqId: string,
  msg: string,
) {
  await supabase.from('bot_action_requests')
    .update({ status: 'failed', executed_at: new Date().toISOString(), result: { error: msg } })
    .eq('id', reqId);
  await sendFollowup(appId, interactionToken, { content: msg, flags: 64 });
}

// ============= Execução final (chamada de ia-handler quando row.action='criar_anuncio' e user confirma) =============

export async function executeCreateAd(
  supabase: ReturnType<typeof createClient>,
  row: any,
): Promise<{ ad_id: string; creative_id: string; status: string; ad_manager_url: string }> {
  const draft = row.creative_draft || {};
  const accountId: string = draft.account_id;
  const adsetId: string = draft.adset_id;
  if (!accountId || !adsetId) throw new Error('Rascunho sem account_id/adset_id.');
  if (!draft.image_hash && !draft.source_instagram_media_id) {
    throw new Error('Rascunho sem imagem (nem image_hash nem source_instagram_media_id).');
  }
  if (!draft.page_id) throw new Error('Rascunho sem page_id.');

  const token = await getMetaToken(supabase);

  const creativeId = await createAdCreative(accountId, token, {
    name: `Creative — ${draft.name}`.slice(0, 100),
    page_id: draft.page_id,
    message: draft.message || '',
    link: draft.link,
    image_hash: draft.image_hash,
    headline: draft.headline || undefined,
    cta_type: draft.cta_type || undefined,
  });

  const status = draft.status_inicial === 'ativo' ? 'ACTIVE' : 'PAUSED';
  const adId = await createAd(accountId, token, {
    name: draft.name,
    adset_id: adsetId,
    creative_id: creativeId,
    status,
  });

  return {
    ad_id: adId,
    creative_id: creativeId,
    status,
    ad_manager_url: `https://business.facebook.com/adsmanager/manage/ads?act=${accountId}&selected_ad_ids=${adId}`,
  };
}
