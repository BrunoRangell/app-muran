// Wizard de criação de anúncio novo dentro de um adset existente (Meta Ads).
// Máquina de estados armazenada em bot_action_requests.status + .creative_draft (jsonb).
//
// Estratégia (v2 — clonagem): em vez de reconstruir o creative do zero (nome/texto/CTA/página
// digitados manualmente), buscamos o anúncio ATIVO mais recente no mesmo conjunto (ou, se não houver,
// qualquer ativo na mesma campanha) e clonamos o `object_story_spec` inteiro dele — CTA, página,
// instagram_actor_id etc. vêm exatamente como já estão rodando (validados pela própria Meta).
// Só a imagem é sempre nova; nome/texto/título/link ficam editáveis num modal enxuto.
// Se não existir NENHUM anúncio ativo pra clonar (conjunto/campanha novos), cai no fluxo antigo
// "do zero" como rede de segurança (draft.mode === 'scratch'), que ainda pede CTA e página manualmente.
//
// Estados:
//   draft_image_source        → mostra 3 botões (upload / drive / instagram)
//   awaiting_image_upload     → aguarda Message Command "Usar como imagem do anúncio"
//   awaiting_drive_link       → modal drive submetido → processa
//   awaiting_instagram_link   → modal IG submetido → processa
//   awaiting_page_pick        → múltiplas pages promovíveis (só modo 'scratch') → select
//   draft_copy                → aguarda modal de copy (nome/texto/[título]/[link]/[CTA só no scratch])
//   awaiting_cta_pick         → CTA não mapeado (só modo 'scratch') → select fallback
//   pending                   → embed final de confirmação (reaproveita ia_confirm)
//   executed / failed / cancelled

import { createClient } from 'npm:@supabase/supabase-js@2';
import { getGoogleAccessToken } from './ia-targets.ts';

const META_API_VERSION = 'v24.0';
const MURAN_ORANGE = 0xff6e00;

// A partir da Marketing API v22.0 a Meta descontinuou o campo "standard_enhancements" isolado
// dentro de creative_features_spec — ele precisa ser substituído pelos sub-recursos individuais
// que compunham o antigo "bundle" de Standard Enhancements (para anúncios de imagem única):
// image_templates, image_touchups, text_optimizations e inline_comment. Mantemos todos como
// OPT_OUT pra preservar o comportamento anterior (sem ajustes automáticos da Meta na criação).
const STANDARD_ENHANCEMENTS_OPT_OUT = {
  image_templates: { enroll_status: 'OPT_OUT' },
  image_touchups: { enroll_status: 'OPT_OUT' },
  text_optimizations: { enroll_status: 'OPT_OUT' },
  inline_comment: { enroll_status: 'OPT_OUT' },
};

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

async function fetchPageName(pageId: string, token: string): Promise<string | null> {
  try {
    const url = `https://graph.facebook.com/${META_API_VERSION}/${pageId}?fields=name&access_token=${encodeURIComponent(token)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) return null;
    return data?.name || null;
  } catch {
    return null;
  }
}

// ============= Clonagem de anúncio ativo =============

type CloneSource = {
  source: 'adset' | 'campaign';
  ad_id: string;
  ad_name: string;
  object_story_spec: any;
};

// Busca o anúncio ATIVO mais recente numa edge (/{id}/ads) que tenha object_story_spec.link_data
// utilizável (pula carrossel/vídeo puro, que não suportamos clonar hoje).
async function fetchMostRecentCloneableAd(
  edgePath: string,
  token: string,
): Promise<{ id: string; name: string; object_story_spec: any } | null> {
  const url =
    `https://graph.facebook.com/${META_API_VERSION}/${edgePath}/ads` +
    `?effective_status=["ACTIVE"]&limit=15&fields=name,created_time,creative{object_story_spec}` +
    `&access_token=${encodeURIComponent(token)}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok || !data?.data?.length) return null;

  const sorted = [...data.data].sort(
    (a: any, b: any) => new Date(b.created_time).getTime() - new Date(a.created_time).getTime(),
  );

  for (const ad of sorted) {
    const oss = ad?.creative?.object_story_spec;
    const linkData = oss?.link_data;
    // Só clonamos anúncios de imagem única com link_data "normal" — sem carrossel (child_attachments)
    // e sem vídeo puro (video_data).
    if (linkData && !linkData.child_attachments) {
      return { id: ad.id, name: ad.name, object_story_spec: oss };
    }
  }
  return null;
}

async function fetchActiveAdToClone(
  adsetId: string,
  campaignId: string | undefined,
  token: string,
): Promise<CloneSource | null> {
  try {
    const inAdset = await fetchMostRecentCloneableAd(adsetId, token);
    if (inAdset) {
      return { source: 'adset', ad_id: inAdset.id, ad_name: inAdset.name, object_story_spec: inAdset.object_story_spec };
    }
  } catch (e) {
    console.error('[fetchActiveAdToClone adset]', e);
  }

  if (campaignId) {
    try {
      const inCampaign = await fetchMostRecentCloneableAd(campaignId, token);
      if (inCampaign) {
        return { source: 'campaign', ad_id: inCampaign.id, ad_name: inCampaign.name, object_story_spec: inCampaign.object_story_spec };
      }
    } catch (e) {
      console.error('[fetchActiveAdToClone campaign]', e);
    }
  }

  return null;
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

// ============= Vídeo: upload, processamento e thumbnail =============
// Diferente de imagem (upload síncrono via /adimages), vídeo sobe pro endpoint /advideos e fica
// "processando" na Meta por alguns segundos antes de poder ser usado num anúncio. É preciso
// aguardar o status virar "ready" e buscar uma thumbnail (a Meta gera automaticamente) antes de
// montar o creative.

async function uploadVideoToMeta(
  accountId: string,
  token: string,
  videoBytes: ArrayBuffer,
  filename: string,
): Promise<{ videoId: string }> {
  const form = new FormData();
  const blob = new Blob([videoBytes]);
  form.append('source', blob, filename);
  form.append('access_token', token);

  const res = await fetch(`https://graph.facebook.com/${META_API_VERSION}/act_${accountId}/advideos`, {
    method: 'POST',
    body: form,
  });
  const data = await res.json();
  if (!res.ok) {
    console.error('[advideos upload]', data);
    throw new MetaApiError(data?.error?.message || `Falha ao subir vídeo para Meta (${res.status})`, data?.error || null);
  }
  if (!data?.id) throw new Error('Meta não retornou o ID do vídeo.');
  return { videoId: data.id as string };
}

// Poll de status até o vídeo terminar de processar (até 90s, checando a cada 3s — vídeos curtos
// costumam ficar prontos bem antes disso). Roda em background (EdgeRuntime.waitUntil), então esse
// tempo não trava a resposta ao Discord, só atrasa o próximo card do wizard aparecer.
async function waitForVideoReady(
  videoId: string,
  token: string,
  maxWaitMs = 90_000,
  intervalMs = 3_000,
): Promise<void> {
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    const url = `https://graph.facebook.com/${META_API_VERSION}/${videoId}?fields=status&access_token=${encodeURIComponent(token)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) {
      console.error('[waitForVideoReady]', data);
      throw new Error(data?.error?.message || `Falha ao checar status do vídeo (${res.status})`);
    }
    const videoStatus = data?.status?.video_status;
    if (videoStatus === 'ready') return;
    if (videoStatus === 'error') {
      throw new Error('A Meta reportou erro ao processar o vídeo enviado. Tente um arquivo diferente.');
    }
    await sleep(intervalMs);
  }
  throw new Error(
    'O vídeo ainda está processando na Meta depois de 90s de espera. O vídeo já foi enviado — aguarde mais um pouco e rode o comando de novo.',
  );
}

async function fetchVideoThumbnailUrl(videoId: string, token: string): Promise<string | null> {
  try {
    const url = `https://graph.facebook.com/${META_API_VERSION}/${videoId}/thumbnails?access_token=${encodeURIComponent(token)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) return null;
    const thumbs: any[] = data?.data || [];
    const preferred = thumbs.find((t) => t.is_preferred) || thumbs[0];
    return preferred?.uri || null;
  } catch {
    return null;
  }
}

// Cria o creative a partir de um object_story_spec CLONADO (modo 'clone') — reaproveita CTA/página/etc.
// exatamente como estavam no anúncio original, só troca a imagem (ou vídeo) e os campos de texto editados.
async function createAdCreativeFromClone(
  accountId: string,
  token: string,
  draft: any,
): Promise<string> {
  // ===== Vídeo: monta video_data, reaproveitando page_id/CTA/mensagem do anúncio clonado =====
  if (draft.video_id) {
    const baseLinkData = draft.base_object_story_spec?.link_data || {};
    const pageId = draft.base_object_story_spec?.page_id || draft.page_id;
    const video_data: any = {
      video_id: draft.video_id,
      message: draft.message || baseLinkData.message || '',
    };
    if (draft.headline) video_data.title = draft.headline;
    if (draft.video_thumbnail_url) video_data.image_url = draft.video_thumbnail_url;
    if (baseLinkData.call_to_action) {
      video_data.call_to_action = JSON.parse(JSON.stringify(baseLinkData.call_to_action));
      if (video_data.call_to_action.value?.link) {
        video_data.call_to_action.value.link = draft.link || video_data.call_to_action.value.link;
      }
    } else if (draft.link) {
      video_data.call_to_action = { type: 'LEARN_MORE', value: { link: draft.link } };
    }

    const body = new URLSearchParams({
      name: `Creative — ${draft.name}`.slice(0, 100),
      object_story_spec: JSON.stringify({ page_id: pageId, video_data }),
      // Sem degrees_of_freedom_spec aqui de propósito: os opt-outs de "standard enhancements" que
      // usamos pra imagem (image_templates/image_touchups/...) são específicos de anúncio de imagem
      // única — mandar isso num creative de vídeo arrisca um novo erro "Invalid parameter" da Meta.
      access_token: token,
    });

    const res = await fetch(`https://graph.facebook.com/${META_API_VERSION}/act_${accountId}/adcreatives`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const data = await res.json();
    if (!res.ok) {
      console.error('[adcreatives clone video]', data);
      throw new MetaApiError(data?.error?.message || `Falha ao criar creative de vídeo clonado (${res.status})`, data?.error || null);
    }
    return data.id as string;
  }

  const oss = JSON.parse(JSON.stringify(draft.base_object_story_spec || {}));
  const linkData = oss.link_data;
  if (!linkData) {
    throw new Error('Configuração original não tem link_data — não é possível clonar este tipo de anúncio.');
  }

  linkData.message = draft.message || linkData.message || '';
  if (draft.headline) linkData.name = draft.headline;
  else delete linkData.name;
  linkData.link = draft.link || linkData.link;
  linkData.image_hash = draft.image_hash;
  delete linkData.picture; // imagem antiga por URL — não deve conviver com image_hash novo
  delete linkData.child_attachments; // segurança extra: nunca deveria chegar aqui num carrossel

  if (linkData.call_to_action?.value?.link) {
    linkData.call_to_action.value.link = draft.link || linkData.call_to_action.value.link;
  }

  const body = new URLSearchParams({
    name: `Creative — ${draft.name}`.slice(0, 100),
    object_story_spec: JSON.stringify(oss),
    degrees_of_freedom_spec: JSON.stringify({ creative_features_spec: STANDARD_ENHANCEMENTS_OPT_OUT }),
    access_token: token,
  });

  const res = await fetch(`https://graph.facebook.com/${META_API_VERSION}/act_${accountId}/adcreatives`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = await res.json();
  if (!res.ok) {
    console.error('[adcreatives clone]', data);
    throw new MetaApiError(data?.error?.message || `Falha ao criar creative clonado (${res.status})`, data?.error || null);
  }
  return data.id as string;
}

// Cria o creative do ZERO (modo 'scratch', fallback quando não há nenhum anúncio ativo pra clonar).
async function createAdCreative(
  accountId: string,
  token: string,
  spec: {
    name: string;
    page_id: string;
    message: string;
    link: string;
    image_hash?: string;
    video_id?: string;
    video_thumbnail_url?: string;
    headline?: string;
    description?: string;
    cta_type?: string;
  },
): Promise<string> {
  const bodyFields: Record<string, string> = {
    name: spec.name,
    access_token: token,
  };

  if (spec.video_id) {
    const video_data: any = { video_id: spec.video_id, message: spec.message };
    if (spec.headline) video_data.title = spec.headline;
    if (spec.video_thumbnail_url) video_data.image_url = spec.video_thumbnail_url;
    if (spec.cta_type && spec.cta_type !== 'NO_BUTTON') {
      video_data.call_to_action = { type: spec.cta_type, value: { link: spec.link } };
    }
    bodyFields.object_story_spec = JSON.stringify({ page_id: spec.page_id, video_data });
    // Sem degrees_of_freedom_spec pra vídeo — ver nota em createAdCreativeFromClone.
  } else {
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
    bodyFields.object_story_spec = JSON.stringify({ page_id: spec.page_id, link_data });
    bodyFields.degrees_of_freedom_spec = JSON.stringify({ creative_features_spec: STANDARD_ENHANCEMENTS_OPT_OUT });
  }

  const body = new URLSearchParams(bodyFields);

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

// ============= CTA mapping (usado só no modo 'scratch', fallback sem anúncio pra clonar) =============

// Enum fechado de call_to_action.type aceito pela Meta (conforme retornado pela própria API).
// Validamos contra essa lista ANTES de mandar pra API — isso evita o bug de aceitar
// qualquer texto em CAIXA_ALTA como "tipo literal" sem checar se é um valor real.
const VALID_META_CTA_TYPES = new Set([
  'BOOK_TRAVEL', 'CONTACT_US', 'DONATE', 'DONATE_NOW', 'DOWNLOAD', 'GET_DIRECTIONS', 'GO_LIVE',
  'INTERESTED', 'LEARN_MORE', 'SEE_DETAILS', 'LIKE_PAGE', 'MESSAGE_PAGE', 'RAISE_MONEY', 'SAVE',
  'SEND_TIP', 'SHOP_NOW', 'SIGN_UP', 'VIEW_INSTAGRAM_PROFILE', 'INSTAGRAM_MESSAGE', 'LOYALTY_LEARN_MORE',
  'PURCHASE_GIFT_CARDS', 'PAY_TO_ACCESS', 'SEE_MORE', 'TRY_IN_CAMERA', 'WHATSAPP_LINK', 'GET_IN_TOUCH',
  'TRY_NOW', 'ASK_A_QUESTION', 'START_A_CHAT', 'CHAT_NOW', 'ASK_US', 'CHAT_WITH_US', 'BOOK_NOW',
  'CHECK_AVAILABILITY', 'ORDER_NOW', 'WHATSAPP_MESSAGE', 'GET_MOBILE_APP', 'INSTALL_MOBILE_APP',
  'USE_MOBILE_APP', 'INSTALL_APP', 'USE_APP', 'PLAY_GAME', 'TRY_DEMO', 'WATCH_VIDEO', 'WATCH_MORE',
  'OPEN_LINK', 'NO_BUTTON', 'LISTEN_MUSIC', 'MOBILE_DOWNLOAD', 'GET_OFFER', 'GET_OFFER_VIEW', 'BUY_NOW',
  'BUY_TICKETS', 'UPDATE_APP', 'BET_NOW', 'ADD_TO_CART', 'SELL_NOW', 'GET_SHOWTIMES', 'LISTEN_NOW',
  'GET_EVENT_TICKETS', 'REMIND_ME', 'SEARCH_MORE', 'PRE_REGISTER', 'SWIPE_UP_PRODUCT', 'SWIPE_UP_SHOP',
  'PLAY_GAME_ON_FACEBOOK', 'VISIT_WORLD', 'OPEN_INSTANT_APP', 'JOIN_GROUP', 'GET_PROMOTIONS',
  'SEND_UPDATES', 'INQUIRE_NOW', 'VISIT_PROFILE', 'CHAT_ON_WHATSAPP', 'EXPLORE_MORE', 'CONFIRM',
  'JOIN_CHANNEL', 'MAKE_AN_APPOINTMENT', 'ASK_ABOUT_SERVICES', 'BOOK_A_CONSULTATION', 'GET_A_QUOTE',
  'BUY_VIA_MESSAGE', 'ASK_FOR_MORE_INFO', 'VIEW_PRODUCT', 'VIEW_CHANNEL', 'WATCH_LIVE_VIDEO',
  'JOIN_LIVE_VIDEO', 'IMAGINE', 'CALL', 'MISSED_CALL', 'CALL_NOW', 'CALL_ME', 'APPLY_NOW', 'BUY',
  'GET_QUOTE', 'SUBSCRIBE', 'RECORD_NOW', 'VOTE_NOW', 'GIVE_FREE_RIDES', 'REGISTER_NOW',
  'OPEN_MESSENGER_EXT', 'EVENT_RSVP', 'CIVIC_ACTION', 'SEND_INVITES', 'REFER_FRIENDS', 'REQUEST_TIME',
  'SEE_MENU', 'SEARCH', 'TRY_IT', 'TRY_ON', 'LINK_CARD', 'DIAL_CODE', 'FIND_YOUR_GROUPS', 'START_ORDER',
]);

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
  // Se veio já em UPPERCASE_TIPO, só aceitamos como literal se for um tipo REAL da Meta.
  if (/^[A-Z_]+$/.test(t) && VALID_META_CTA_TYPES.has(t)) return { type: t, confident: true };
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
  // Best-effort: tenta achar um anúncio ativo pra clonar (conjunto → fallback campanha).
  let clone: CloneSource | null = null;
  try {
    const token = await getMetaToken(supabase);
    clone = await fetchActiveAdToClone(input.adsetTargetId, input.hierarchy?.campaign_id, token);
  } catch (e) {
    console.error('[startCreateAdFlow clone lookup]', e);
  }

  const draft: any = {
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
    page_name: null,
    name: null,
    message: null,
    headline: null,
    description: null,
    link: null,
    cta_type: null,
  };

  if (clone) {
    draft.mode = 'clone';
    draft.base_object_story_spec = clone.object_story_spec;
    draft.page_id = clone.object_story_spec.page_id || null;
    draft.cta_type = clone.object_story_spec.link_data?.call_to_action?.type || null;
    draft.clone_source_ad_id = clone.ad_id;
    draft.clone_source_ad_name = clone.ad_name;
    draft.clone_source_scope = clone.source; // 'adset' | 'campaign'
    // Defaults pro modal de copy (editáveis)
    draft.name = clone.ad_name;
    draft.message = clone.object_story_spec.link_data?.message || null;
    draft.headline = clone.object_story_spec.link_data?.name || null;
    draft.link = clone.object_story_spec.link_data?.link || null;
  } else {
    draft.mode = 'scratch';
  }

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

  await editOriginal(appId, interactionToken, buildImageSourcePayload(input, inserted.id, clone));
}

function buildImageSourcePayload(input: CreateAdStartInput, reqId: string, clone: CloneSource | null) {
  const path =
    (input.hierarchy?.campaign_name ? `**Campanha:** ${input.hierarchy.campaign_name}\n` : '') +
    `**Conjunto:** ${input.adsetName}`;
  const statusLine =
    input.statusInicial === 'ativo'
      ? '🟢 Vai nascer **ativo** (o usuário pediu explicitamente).'
      : '⏸️ Vai nascer **pausado** por padrão (peça "ativo" no comando para mudar).';
  const cloneLine = clone
    ? `\n♻️ Vou usar como base a configuração do anúncio **${clone.ad_name}** (${clone.source === 'adset' ? 'mesmo conjunto' : 'mesma campanha'}) — CTA e página herdados automaticamente, sem precisar redigitar. Você só ajusta texto/link e manda uma imagem nova.`
    : `\n⚠️ Não encontrei nenhum anúncio ativo pra copiar a configuração (nem no conjunto, nem na campanha) — vamos montar do zero, então vou pedir CTA e página também.`;
  return {
    content: '',
    embeds: [
      {
        title: '📣 Criar novo anúncio — escolha a fonte da imagem',
        description: `${path}\n\n${statusLine}${cloneLine}\n\nDe onde vem a imagem/mídia do anúncio?`,
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
          title: '📤 Envie a imagem ou vídeo do anúncio',
          description:
            '1) Poste a imagem **ou vídeo** **neste canal** como uma mensagem normal.\n' +
            '2) Depois clique **com o botão direito** (ou segure, no mobile) na sua própria mensagem → **Apps** → **Usar como imagem do anúncio** (funciona pra vídeo também).\n\n' +
            '_O arquivo será enviado automaticamente para o Meta (vídeo demora um pouco mais, ele precisa processar) e o wizard continuará._',
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

// ============= Google Drive: extrai file/folder id e baixa imagens =============

function extractDriveFileId(url: string): string | null {
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
  ];
  for (const rx of patterns) {
    const m = url.match(rx);
    if (m?.[1]) return m[1];
  }
  return null;
}

function extractDriveFolderId(url: string): string | null {
  const m = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  return m?.[1] || null;
}

// Reaproveita as MESMAS credenciais OAuth já configuradas pro Google Ads (google_ads_client_id/
// google_ads_client_secret/google_ads_refresh_token) — não precisa cadastrar nada novo. Só funciona
// se o token gerado por essas credenciais tiver o escopo do Drive liberado; caso contrário a própria
// API do Google devolve erro de "escopo insuficiente" e reportamos isso claramente no Discord.
async function getGoogleDriveAccessToken(): Promise<string | null> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const auth = await getGoogleAccessToken(supabaseUrl, supabaseKey);
  return auth?.accessToken || null;
}

// Limite de itens processados por pasta numa única execução — protege contra timeout da edge
// function e contra estourar rate limit de criação de anúncios na Meta. Vídeo tem limite mais baixo
// de propósito: cada um precisa processar na Meta antes de virar anúncio (pode levar dezenas de
// segundos), então cabe menos vídeo do que imagem dentro do mesmo orçamento de tempo de execução.
const MAX_DRIVE_FOLDER_IMAGES = 20;
const MAX_DRIVE_FOLDER_VIDEOS = 8;

async function listDriveFolderMedia(
  folderId: string,
  accessToken: string,
): Promise<{ images: Array<{ id: string; name: string }>; videos: Array<{ id: string; name: string }> }> {
  const q = encodeURIComponent(
    `'${folderId}' in parents and (mimeType contains 'image/' or mimeType contains 'video/') and trashed = false`,
  );
  const url =
    `https://www.googleapis.com/drive/v3/files?q=${q}` +
    `&fields=${encodeURIComponent('files(id,name,mimeType)')}&pageSize=200`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  const data = await res.json();
  if (!res.ok) {
    console.error('[listDriveFolderMedia]', data);
    const isScopeErr = res.status === 403 && /insufficient|scope/i.test(data?.error?.message || '');
    throw new Error(
      isScopeErr
        ? 'As credenciais Google atuais (as mesmas do Google Ads) não têm o escopo do Drive liberado. Seria preciso reautorizar essas credenciais incluindo o escopo "https://www.googleapis.com/auth/drive.readonly".'
        : data?.error?.message || `Falha ao listar a pasta do Drive (${res.status}). Verifique se a pasta está acessível pra essa conta Google.`,
    );
  }
  const files: any[] = data?.files || [];
  const images = files.filter((f) => (f.mimeType || '').startsWith('image/')).map((f) => ({ id: f.id, name: f.name }));
  const videos = files.filter((f) => (f.mimeType || '').startsWith('video/')).map((f) => ({ id: f.id, name: f.name }));
  return { images, videos };
}

// Poll de status de VÁRIOS vídeos em paralelo — bem mais rápido que esperar um de cada vez, já que
// a Meta processa os vídeos em paralelo do lado dela. Devolve quais ficaram prontos dentro do prazo
// e quais não (essas últimas são reportadas como falha no resumo, igual outras falhas do lote).
async function waitForVideosReady(
  videoIds: string[],
  token: string,
  maxWaitMs = 90_000,
  intervalMs = 3_000,
): Promise<{ ready: Set<string>; timedOut: Set<string> }> {
  const pending = new Set(videoIds);
  const ready = new Set<string>();
  const deadline = Date.now() + maxWaitMs;

  while (pending.size > 0 && Date.now() < deadline) {
    await Promise.all(
      Array.from(pending).map(async (videoId) => {
        try {
          const url = `https://graph.facebook.com/${META_API_VERSION}/${videoId}?fields=status&access_token=${encodeURIComponent(token)}`;
          const res = await fetch(url);
          const data = await res.json();
          if (!res.ok) return; // tenta de novo no próximo ciclo
          const videoStatus = data?.status?.video_status;
          if (videoStatus === 'ready') {
            ready.add(videoId);
            pending.delete(videoId);
          } else if (videoStatus === 'error') {
            pending.delete(videoId); // não vai ficar pronto — desiste dele
          }
        } catch (e) {
          console.error('[waitForVideosReady] erro checando', videoId, e);
        }
      }),
    );
    if (pending.size > 0 && Date.now() < deadline) await sleep(intervalMs);
  }

  return { ready, timedOut: pending };
}

async function fetchDriveFileBytes(
  fileId: string,
  accessToken?: string | null,
): Promise<{ bytes: ArrayBuffer; contentType: string | null }> {
  const url = accessToken
    ? `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`
    : `https://drive.google.com/uc?export=download&id=${fileId}`;
  const res = await fetch(url, {
    redirect: 'follow',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });
  if (!res.ok) {
    throw new Error(`Falha ao baixar arquivo do Google Drive (${res.status}).`);
  }
  const contentType = res.headers.get('content-type');
  const bytes = await res.arrayBuffer();
  if (!accessToken && contentType?.includes('text/html')) {
    throw new Error('O Google Drive pediu confirmação de download para um dos arquivos (permissão ou tamanho). Ajuste o compartilhamento para "Qualquer pessoa com o link".');
  }
  return { bytes, contentType };
}

async function fetchDriveImageBytes(
  driveUrl: string,
  accessToken?: string | null,
): Promise<{ bytes: ArrayBuffer; contentType: string | null }> {
  const fileId = extractDriveFileId(driveUrl);
  if (!fileId) {
    throw new Error('Não consegui identificar o ID do arquivo no link do Google Drive. Use um link do tipo "Compartilhar" (.../file/d/ID/view).');
  }
  return fetchDriveFileBytes(fileId, accessToken);
}

// ============= FLOW: modal "Link do Drive" submetido (arquivo único OU pasta inteira) =============

export async function handleDriveModalSubmit(
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
  const driveLink = (fields.drive_link || '').trim();

  const { data: row } = await supabase.from('bot_action_requests').select('*').eq('id', reqId).maybeSingle();
  if (!row || row.status !== 'draft_image_source') {
    await editOriginal(appId, interactionToken, {
      content: `ℹ️ Este wizard não está esperando o link do Drive (status: ${row?.status || 'inexistente'}).`,
      embeds: [],
      components: [],
    });
    return;
  }

  if (!/^https?:\/\/(drive|docs)\.google\.com\//i.test(driveLink)) {
    await editOriginal(appId, interactionToken, {
      content: '❌ Isso não parece um link do Google Drive. Clique novamente em "🔗 Link do Drive" e cole a URL de compartilhamento (de um arquivo ou de uma pasta).',
      embeds: [],
      components: [],
    });
    return;
  }

  const draft = row.creative_draft || {};
  const accountId: string = draft.account_id;
  if (!accountId) {
    await editOriginal(appId, interactionToken, { content: '❌ account_id perdido no rascunho.', embeds: [], components: [] });
    return;
  }

  const folderId = extractDriveFolderId(driveLink);

  try {
    const token = await getMetaToken(supabase);

    // ===== Modo PASTA: cria 1 anúncio por imagem, todos com o mesmo texto (preenchido a seguir) =====
    if (folderId) {
      let driveAccessToken: string | null = null;
      try {
        driveAccessToken = await getGoogleDriveAccessToken();
      } catch (e) {
        console.error('[handleDriveModalSubmit] getGoogleDriveAccessToken', e);
      }
      if (!driveAccessToken) {
        await editOriginal(appId, interactionToken, {
          content:
            '❌ Link de pasta do Drive detectado, mas não consegui gerar um token com as credenciais Google Ads ' +
            '(google_ads_client_id/client_secret/refresh_token) configuradas. Verifique se elas estão completas, ou cole o link de UM arquivo específico por enquanto.',
          embeds: [],
          components: [],
        });
        return;
      }

      const { images: imageFiles, videos: videoFiles } = await listDriveFolderMedia(folderId, driveAccessToken);
      if (!imageFiles.length && !videoFiles.length) {
        await editOriginal(appId, interactionToken, {
          content: '❌ Não encontrei nenhuma imagem ou vídeo nessa pasta do Drive (ou ela não está compartilhada como "Qualquer pessoa com o link").',
          embeds: [],
          components: [],
        });
        return;
      }

      const cappedImages = imageFiles.slice(0, MAX_DRIVE_FOLDER_IMAGES);
      const cappedVideos = videoFiles.slice(0, MAX_DRIVE_FOLDER_VIDEOS);

      type BatchItem = {
        name: string;
        type: 'image' | 'video';
        image_hash?: string;
        video_id?: string;
        video_thumbnail_url?: string | null;
        image_preview_url: string | null;
      };
      const batchItems: BatchItem[] = [];
      const failedNames: string[] = [];

      // Imagens: upload síncrono e rápido, uma de cada vez (como já era).
      for (const f of cappedImages) {
        try {
          const { bytes } = await fetchDriveFileBytes(f.id, driveAccessToken);
          const { hash, url: previewUrl } = await uploadImageToMetaAdImages(accountId, token, bytes, f.name);
          batchItems.push({ name: f.name, type: 'image', image_hash: hash, image_preview_url: previewUrl || null });
        } catch (e: any) {
          console.error('[handleDriveModalSubmit] falha numa imagem da pasta', f.name, e);
          failedNames.push(f.name);
        }
      }

      // Vídeos: sobe TODOS primeiro, depois espera o processamento de TODOS em paralelo — evita
      // multiplicar o tempo de espera por vídeo x quantidade de vídeos.
      if (cappedVideos.length) {
        const uploaded: Array<{ name: string; videoId: string }> = [];
        for (const f of cappedVideos) {
          try {
            const { bytes } = await fetchDriveFileBytes(f.id, driveAccessToken);
            const { videoId } = await uploadVideoToMeta(accountId, token, bytes, f.name);
            uploaded.push({ name: f.name, videoId });
          } catch (e: any) {
            console.error('[handleDriveModalSubmit] falha subindo vídeo da pasta', f.name, e);
            failedNames.push(f.name);
          }
        }

        if (uploaded.length) {
          const { ready } = await waitForVideosReady(uploaded.map((u) => u.videoId), token);
          for (const u of uploaded) {
            if (!ready.has(u.videoId)) {
              console.error('[handleDriveModalSubmit] vídeo não ficou pronto a tempo', u.name);
              failedNames.push(`${u.name} (ainda processando)`);
              continue;
            }
            const thumbUrl = await fetchVideoThumbnailUrl(u.videoId, token);
            batchItems.push({
              name: u.name,
              type: 'video',
              video_id: u.videoId,
              video_thumbnail_url: thumbUrl,
              image_preview_url: thumbUrl,
            });
          }
        }
      }

      if (!batchItems.length) {
        await editOriginal(appId, interactionToken, {
          content: '❌ Nada da pasta pôde ser processado com sucesso. Verifique as permissões dos arquivos (e se os vídeos não são grandes demais pra processar a tempo).',
          embeds: [],
          components: [],
        });
        return;
      }

      const newDraft = {
        ...draft,
        source: 'drive_folder',
        batch_images: batchItems,
        image_hash: null,
        video_id: null,
        image_preview_url: batchItems[0].image_preview_url,
      };
      await supabase
        .from('bot_action_requests')
        .update({ status: 'draft_copy', creative_draft: newDraft })
        .eq('id', reqId);

      const notas: string[] = [];
      const skippedImages = imageFiles.length - cappedImages.length;
      const skippedVideos = videoFiles.length - cappedVideos.length;
      if (skippedImages > 0) notas.push(`⚠️ A pasta tem ${imageFiles.length} imagens — processei só as primeiras ${MAX_DRIVE_FOLDER_IMAGES}.`);
      if (skippedVideos > 0) notas.push(`⚠️ A pasta tem ${videoFiles.length} vídeos — processei só os primeiros ${MAX_DRIVE_FOLDER_VIDEOS}.`);
      if (failedNames.length) notas.push(`⚠️ ${failedNames.length} arquivo(s) falharam e foram ignorados: ${failedNames.join(', ')}`);

      const imgCount = batchItems.filter((b) => b.type === 'image').length;
      const vidCount = batchItems.filter((b) => b.type === 'video').length;
      const mediaSummary = [
        imgCount ? `${imgCount} imagem${imgCount === 1 ? '' : 's'}` : null,
        vidCount ? `${vidCount} vídeo${vidCount === 1 ? '' : 's'}` : null,
      ]
        .filter(Boolean)
        .join(' + ');

      await editOriginal(appId, interactionToken, {
        content: '',
        embeds: [
          {
            title: `✅ ${batchItems.length} arquivos da pasta enviados ao Meta`,
            description:
              `Vou criar **${batchItems.length} anúncios** (${mediaSummary}), todos com o mesmo texto/título/link/CTA.\n` +
              (notas.length ? `\n${notas.join('\n')}\n` : '') +
              `\nAgora clique em **📝 Preencher texto do anúncio** — esse texto vale pra todos.`,
            color: MURAN_ORANGE,
            image: batchItems[0].image_preview_url ? { url: batchItems[0].image_preview_url } : undefined,
          },
        ],
        components: [
          {
            type: 1,
            components: [
              { type: 2, style: 1, label: '📝 Preencher texto do anúncio', custom_id: `ia_create_open_copy:${reqId}` },
              { type: 2, style: 4, label: '❌ Cancelar', custom_id: `ia_cancel:${reqId}` },
            ],
          },
        ],
      });
      return;
    }

    // ===== Modo ARQUIVO ÚNICO (imagem ou vídeo — detectado pelo content-type do download) =====
    let singleAccessToken: string | null = null;
    try {
      singleAccessToken = await getGoogleDriveAccessToken();
    } catch {
      // Sem credenciais Google configuradas — cai no download público sem autenticação.
    }
    const { bytes, contentType } = await fetchDriveImageBytes(driveLink, singleAccessToken);
    const isVideo = (contentType || '').toLowerCase().startsWith('video/');

    let newDraft: any;
    let previewUrl: string | null = null;

    if (isVideo) {
      const { videoId } = await uploadVideoToMeta(accountId, token, bytes, 'anuncio-drive.mp4');
      await waitForVideoReady(videoId, token);
      previewUrl = await fetchVideoThumbnailUrl(videoId, token);
      newDraft = {
        ...draft,
        source: 'drive',
        media_type: 'video',
        video_id: videoId,
        video_thumbnail_url: previewUrl,
        image_hash: null,
        image_preview_url: previewUrl,
      };
    } else {
      const { hash, url: imgPreview } = await uploadImageToMetaAdImages(accountId, token, bytes, 'anuncio-drive.jpg');
      previewUrl = imgPreview || null;
      newDraft = { ...draft, source: 'drive', media_type: 'image', image_hash: hash, image_preview_url: previewUrl };
    }

    await supabase
      .from('bot_action_requests')
      .update({ status: 'draft_copy', creative_draft: newDraft })
      .eq('id', reqId);

    await editOriginal(appId, interactionToken, {
      content: '',
      embeds: [
        {
          title: isVideo ? '✅ Vídeo recebido do Google Drive e processado no Meta' : '✅ Imagem recebida do Google Drive e enviada ao Meta',
          description: 'Agora clique em **📝 Preencher texto do anúncio** para informar nome, texto, título e link.',
          color: MURAN_ORANGE,
          image: previewUrl ? { url: previewUrl } : undefined,
        },
      ],
      components: [
        {
          type: 1,
          components: [
            { type: 2, style: 1, label: '📝 Preencher texto do anúncio', custom_id: `ia_create_open_copy:${reqId}` },
            { type: 2, style: 4, label: '❌ Cancelar', custom_id: `ia_cancel:${reqId}` },
          ],
        },
      ],
    });
  } catch (e: any) {
    console.error('[handleDriveModalSubmit]', e);
    await editOriginal(appId, interactionToken, {
      content: `⚠️ ${e?.message || 'Falha ao processar o link do Drive.'}`,
      embeds: [],
      components: [],
    });
  }
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

    // Extrair mensagem selecionada e o primeiro anexo de imagem OU vídeo
    const targetMessageId: string | undefined = interaction.data?.target_id;
    const resolvedMsg =
      (interaction.data?.resolved?.messages || {})[targetMessageId || ''] || null;
    const attachments: any[] = resolvedMsg?.attachments || [];
    const mediaAtt = attachments.find((a) => {
      const ct = (a.content_type || '').toLowerCase();
      return ct.startsWith('image/') || ct.startsWith('video/');
    });

    if (!mediaAtt?.url) {
      await sendFollowup(appId, interactionToken, {
        content: '❌ A mensagem selecionada não tem nenhum anexo de imagem ou vídeo. Poste um arquivo e tente de novo.',
        flags: 64,
      });
      return;
    }

    const isVideo = (mediaAtt.content_type || '').toLowerCase().startsWith('video/');

    // Baixar arquivo
    const mediaRes = await fetch(mediaAtt.url);
    if (!mediaRes.ok) {
      await sendFollowup(appId, interactionToken, {
        content: `❌ Falha ao baixar o arquivo do Discord (${mediaRes.status}).`,
        flags: 64,
      });
      return;
    }
    const mediaBytes = await mediaRes.arrayBuffer();
    const filename = (mediaAtt.filename || (isVideo ? 'anuncio.mp4' : 'anuncio.jpg')).replace(/[^\w.\-]/g, '_');

    const draft = row.creative_draft || {};
    const accountId: string = draft.account_id;
    if (!accountId) {
      await sendFollowup(appId, interactionToken, { content: '❌ account_id perdido no rascunho.', flags: 64 });
      return;
    }
    const token = await getMetaToken(supabase);

    let newDraft: any;
    let previewUrl: string | null = null;

    if (isVideo) {
      const { videoId } = await uploadVideoToMeta(accountId, token, mediaBytes, filename);
      await waitForVideoReady(videoId, token);
      previewUrl = await fetchVideoThumbnailUrl(videoId, token);
      newDraft = {
        ...draft,
        source: 'upload',
        media_type: 'video',
        video_id: videoId,
        video_thumbnail_url: previewUrl,
        image_hash: null,
        image_preview_url: previewUrl,
      };
    } else {
      const { hash, url: imgPreview } = await uploadImageToMetaAdImages(accountId, token, mediaBytes, filename);
      previewUrl = imgPreview || mediaAtt.url;
      newDraft = { ...draft, source: 'upload', media_type: 'image', image_hash: hash, image_preview_url: previewUrl };
    }

    await supabase
      .from('bot_action_requests')
      .update({ status: 'draft_copy', creative_draft: newDraft })
      .eq('id', row.id);

    // O Message Command é uma interação totalmente separada da mensagem original do wizard, então
    // o token de interação dela não serve pra editar a mensagem do wizard — usamos o BOT TOKEN pra
    // editar a MESMA mensagem do wizard direto, já com o card final + botão, em vez de criar uma
    // mensagem efêmera nova avulsa (que poluiria o canal).
    const wizardMsg = draft.wizard_message;
    const finalCard = {
      content: '',
      embeds: [
        {
          title: isVideo ? '✅ Vídeo recebido e processado no Meta' : '✅ Imagem recebida e enviada ao Meta',
          description:
            `**Conjunto:** ${draft.adset_name}\n\nAgora clique em **📝 Preencher texto do anúncio** para informar nome, texto, título e link.`,
          color: MURAN_ORANGE,
          image: previewUrl ? { url: previewUrl } : undefined,
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
    };

    if (wizardMsg?.message_id && wizardMsg?.channel_id) {
      await editMessageWithBotToken(wizardMsg.channel_id, wizardMsg.message_id, finalCard);
    } else {
      // Sem referência da mensagem do wizard (não deveria acontecer) — fallback: mensagem nova.
      await sendFollowup(appId, interactionToken, { ...finalCard, flags: 64 });
    }
  } catch (e: any) {
    console.error('[handleMessageAttachImage]', e);
    await sendFollowup(appId, interactionToken, {
      content: `⚠️ Erro: ${e?.message || 'falha desconhecida'}`,
      flags: 64,
    });
  }
}

// ============= Modal de copy — modo CLONE (enxuto: sem CTA, sem página) =============

export function buildCopyModalClone(
  reqId: string,
  prefill?: { name?: string; message?: string; headline?: string; link?: string } | null,
) {
  return {
    type: 9,
    data: {
      custom_id: `ia_create_copy_modal:${reqId}`,
      title: 'Texto do anúncio (CTA/página herdados)',
      components: [
        {
          type: 1,
          components: [
            {
              type: 4, custom_id: 'ad_name', style: 1, label: 'Nome do anúncio',
              placeholder: 'Ex: AD12 - Promo Julho', required: true, min_length: 1, max_length: 200,
              ...(prefill?.name ? { value: prefill.name.slice(0, 200) } : {}),
            },
          ],
        },
        {
          type: 1,
          components: [
            {
              type: 4, custom_id: 'ad_message', style: 2, label: 'Texto principal (message)',
              placeholder: 'Texto que aparece acima da imagem', required: true, min_length: 1, max_length: 2000,
              ...(prefill?.message ? { value: prefill.message.slice(0, 2000) } : {}),
            },
          ],
        },
        {
          type: 1,
          components: [
            {
              type: 4, custom_id: 'ad_headline', style: 1, label: 'Título (headline, opcional)',
              placeholder: 'Ex: Frete grátis hoje!', required: false, max_length: 250,
              ...(prefill?.headline ? { value: prefill.headline.slice(0, 250) } : {}),
            },
          ],
        },
        {
          type: 1,
          components: [
            {
              type: 4, custom_id: 'ad_link', style: 1, label: 'Link de destino',
              placeholder: 'https://...', required: true, min_length: 4, max_length: 500,
              ...(prefill?.link ? { value: prefill.link.slice(0, 500) } : {}),
            },
          ],
        },
      ],
    },
  };
}

// ============= Modal de copy — modo SCRATCH (do zero: com CTA, sem prefill) =============

export function buildCopyModal(
  reqId: string,
  prefill?: { name?: string; message?: string; headline?: string; link?: string; cta_type?: string } | null,
) {
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
              ...(prefill?.name ? { value: prefill.name.slice(0, 200) } : {}),
            },
          ],
        },
        {
          type: 1,
          components: [
            {
              type: 4, custom_id: 'ad_message', style: 2, label: 'Texto principal (message)',
              placeholder: 'Texto que aparece acima da imagem', required: true, min_length: 1, max_length: 2000,
              ...(prefill?.message ? { value: prefill.message.slice(0, 2000) } : {}),
            },
          ],
        },
        {
          type: 1,
          components: [
            {
              type: 4, custom_id: 'ad_headline', style: 1, label: 'Título (headline, opcional)',
              placeholder: 'Ex: Frete grátis hoje!', required: false, max_length: 250,
              ...(prefill?.headline ? { value: prefill.headline.slice(0, 250) } : {}),
            },
          ],
        },
        {
          type: 1,
          components: [
            {
              type: 4, custom_id: 'ad_link', style: 1, label: 'Link de destino',
              placeholder: 'https://...', required: true, min_length: 4, max_length: 500,
              ...(prefill?.link ? { value: prefill.link.slice(0, 500) } : {}),
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
    await editOriginal(appId, interactionToken, {
      content: `ℹ️ Este wizard não está esperando o texto (status: ${row?.status || 'inexistente'}).`,
      embeds: [],
      components: [],
    });
    return;
  }

  const link = (fields.ad_link || '').trim();
  if (!/^https?:\/\//i.test(link)) {
    await editOriginal(appId, interactionToken, {
      content: '❌ Link de destino inválido. Deve começar com http(s)://. Clique novamente em **📝 Preencher texto do anúncio**.',
      embeds: [],
      components: [],
    });
    return;
  }

  const draft = row.creative_draft || {};

  // ===== Modo CLONE: sem CTA no modal — CTA/página já vêm do anúncio clonado =====
  if (draft.mode === 'clone') {
    const newDraft = {
      ...draft,
      name: fields.ad_name?.trim() || draft.adset_name,
      message: fields.ad_message?.trim() || '',
      headline: fields.ad_headline?.trim() || null,
      link,
    };
    await supabase.from('bot_action_requests').update({ creative_draft: newDraft }).eq('id', reqId);
    await showFinalConfirmation(supabase, appId, interactionToken, reqId);
    return;
  }

  // ===== Modo SCRATCH: fluxo antigo, com CTA validado =====
  const cta = mapCta(fields.ad_cta);
  const newDraft = {
    ...draft,
    name: fields.ad_name?.trim() || draft.adset_name,
    message: fields.ad_message?.trim() || '',
    headline: fields.ad_headline?.trim() || null,
    link,
    cta_free_text: fields.ad_cta?.trim() || null,
    cta_type: cta.type,
  };

  // Se CTA não foi mapeado (ou não é um tipo válido da Meta), pedir escolha via select
  if (fields.ad_cta && !cta.type) {
    await supabase.from('bot_action_requests')
      .update({ creative_draft: newDraft, status: 'awaiting_cta_pick' })
      .eq('id', reqId);
    await editOriginal(appId, interactionToken, {
      content: `🤔 Não consegui mapear o CTA "${fields.ad_cta}" pra um tipo válido da Meta. Escolha um da lista:`,
      embeds: [],
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
  if (!chosen || !VALID_META_CTA_TYPES.has(chosen)) {
    await editOriginal(appId, interactionToken, { content: '❌ CTA inválido selecionado. Tente novamente.', embeds: [], components: [] });
    return;
  }
  const { data: row } = await supabase
    .from('bot_action_requests').select('*').eq('id', reqId).maybeSingle();
  if (!row) return;
  const draft = { ...(row.creative_draft || {}), cta_type: chosen };
  await supabase.from('bot_action_requests').update({ creative_draft: draft }).eq('id', reqId);
  await advanceAfterCopy(supabase, appId, interactionToken, reqId);
}

// Só usado no modo 'scratch' (modo 'clone' pula direto pra showFinalConfirmation).
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
        await editOriginal(appId, interactionToken, {
          content: '📄 Esta conta tem mais de uma Página. Qual usar como identidade do anúncio?',
          embeds: [],
          components: [
            {
              type: 1, components: [{
                type: 3, custom_id: `ia_create_page_pick:${reqId}`, placeholder: 'Selecione a página',
                options: pages.slice(0, 25).map((p) => ({ label: p.name.slice(0, 100), value: p.id })),
              }],
            },
          ],
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

  // Resolve nome da página pra exibição (best-effort, não bloqueia se falhar)
  let pageName = draft.page_name || null;
  if (!pageName && draft.page_id) {
    try {
      const token = await getMetaToken(supabase);
      pageName = await fetchPageName(draft.page_id, token);
    } catch {
      // ignore
    }
  }

  await supabase.from('bot_action_requests').update({ status: 'pending' }).eq('id', reqId);

  const statusIni = draft.status_inicial === 'ativo' ? 'ACTIVE' : 'PAUSED';
  const path =
    (draft.campaign_name ? `**Campanha:** ${draft.campaign_name}\n` : '') +
    `**Conjunto:** ${draft.adset_name}`;
  const cloneNote =
    draft.mode === 'clone'
      ? `♻️ **Copiado de:** ${draft.clone_source_ad_name} (${draft.clone_source_scope === 'adset' ? 'mesmo conjunto' : 'mesma campanha'}) — CTA e página herdados\n`
      : '';
  const batchNote =
    Array.isArray(draft.batch_images) && draft.batch_images.length > 1
      ? `📦 **Modo lote:** vou criar **${draft.batch_images.length} anúncios** (1 por arquivo da pasta), todos com este mesmo texto/CTA/página.\n\n`
      : '';
  const mediaNote = draft.media_type === 'video' ? `**Mídia:** 🎬 Vídeo\n` : `**Mídia:** 🖼️ Imagem\n`;

  const payload = {
    content: '',
    embeds: [
      {
        title: batchNote ? `🤖 Confirmação — criar ${draft.batch_images.length} anúncios (lote)` : '🤖 Confirmação — criar novo anúncio',
        description:
          `${batchNote}${path}\n\n${cloneNote}${mediaNote}` +
          `**Nome:** ${draft.name}\n` +
          `**Texto:** ${(draft.message || '').slice(0, 400)}${(draft.message || '').length > 400 ? '…' : ''}\n` +
          (draft.headline ? `**Título:** ${draft.headline}\n` : '') +
          `**Link:** ${draft.link}\n` +
          `**CTA:** ${draft.cta_type || 'sem botão'}\n` +
          `**Página:** ${pageName || draft.page_id}\n` +
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
  // Edita a MESMA mensagem do wizard (o modal/select que chegou até aqui foi acordado com
  // DEFERRED_UPDATE_MESSAGE, então @original aponta pra essa mesma mensagem) — evita criar
  // mais um card efêmero avulso no canal.
  await editOriginal(appId, interactionToken, payload);
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
  await editOriginal(appId, interactionToken, { content: msg, embeds: [], components: [] });
}

// ============= Execução final (chamada de ia-handler quando row.action='criar_anuncio' e user confirma) =============

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type CreateAdResult =
  | { batch: false; ad_id: string; creative_id: string; status: string; ad_manager_url: string }
  | {
      batch: true;
      ads: Array<{ ad_id: string; creative_id: string; status: string; ad_manager_url: string; image_name: string }>;
      failed: Array<{ image_name: string; error: string }>;
    };

export async function executeCreateAd(
  supabase: ReturnType<typeof createClient>,
  row: any,
): Promise<CreateAdResult> {
  const draft = row.creative_draft || {};
  const accountId: string = draft.account_id;
  const adsetId: string = draft.adset_id;
  if (!accountId || !adsetId) throw new Error('Rascunho sem account_id/adset_id.');
  if (!draft.page_id) throw new Error('Rascunho sem page_id.');

  const token = await getMetaToken(supabase);
  const status = draft.status_inicial === 'ativo' ? 'ACTIVE' : 'PAUSED';

  // ===== Modo LOTE: 1 anúncio por imagem da pasta do Drive, mesmo texto/CTA/página em todos =====
  if (Array.isArray(draft.batch_images) && draft.batch_images.length > 0) {
    const ads: Array<{ ad_id: string; creative_id: string; status: string; ad_manager_url: string; image_name: string }> = [];
    const failed: Array<{ image_name: string; error: string }> = [];

    for (let i = 0; i < draft.batch_images.length; i++) {
      const img = draft.batch_images[i];
      const adName = `${draft.name} (${i + 1}/${draft.batch_images.length})`.slice(0, 100);
      const isVideoItem = img.type === 'video';
      const perImageDraft = isVideoItem
        ? { ...draft, image_hash: null, video_id: img.video_id, video_thumbnail_url: img.video_thumbnail_url, name: adName }
        : { ...draft, image_hash: img.image_hash, video_id: null, name: adName };

      // Até 2 tentativas por item — falhas de criação em sequência rápida na Meta costumam ser
      // transitórias (timeout/rate limit momentâneo), então uma pequena pausa + retry resolve
      // a maioria dos casos sem precisar o usuário rodar tudo de novo manualmente.
      let lastErr: any = null;
      let createdOk = false;
      for (let attempt = 0; attempt < 2 && !createdOk; attempt++) {
        if (attempt > 0) await sleep(1000);
        try {
          const creativeId =
            draft.mode === 'clone' && draft.base_object_story_spec
              ? await createAdCreativeFromClone(accountId, token, perImageDraft)
              : await createAdCreative(accountId, token, {
                  name: `Creative — ${adName}`.slice(0, 100),
                  page_id: draft.page_id,
                  message: draft.message || '',
                  link: draft.link,
                  image_hash: isVideoItem ? undefined : img.image_hash,
                  video_id: isVideoItem ? img.video_id : undefined,
                  video_thumbnail_url: isVideoItem ? img.video_thumbnail_url : undefined,
                  headline: draft.headline || undefined,
                  cta_type: draft.cta_type || undefined,
                });

          const adId = await createAd(accountId, token, {
            name: adName,
            adset_id: adsetId,
            creative_id: creativeId,
            status,
          });

          ads.push({
            ad_id: adId,
            creative_id: creativeId,
            status,
            ad_manager_url: `https://business.facebook.com/adsmanager/manage/ads?act=${accountId}&selected_ad_ids=${adId}`,
            image_name: img.name,
          });
          createdOk = true;
        } catch (e: any) {
          lastErr = e;
          console.error('[executeCreateAd batch]', img.name, `tentativa ${attempt + 1}`, e);
        }
      }

      if (!createdOk) {
        failed.push({ image_name: img.name, error: lastErr?.message || String(lastErr) });
      }

      // Pequeno intervalo entre criações — reduz a chance de esbarrar em rate limit da Meta.
      if (i < draft.batch_images.length - 1) await sleep(400);
    }

    if (!ads.length) {
      throw new Error(
        `Nenhum dos ${draft.batch_images.length} anúncios do lote pôde ser criado. Primeiro erro: ${failed[0]?.error || 'desconhecido'}`,
      );
    }

    return { batch: true, ads, failed };
  }

  // ===== Modo ÚNICO (comportamento original — agora também aceita vídeo) =====
  if (!draft.image_hash && !draft.video_id && !draft.source_instagram_media_id) {
    throw new Error('Rascunho sem mídia (nem imagem, nem vídeo, nem source_instagram_media_id).');
  }

  const creativeId =
    draft.mode === 'clone' && draft.base_object_story_spec
      ? await createAdCreativeFromClone(accountId, token, draft)
      : await createAdCreative(accountId, token, {
          name: `Creative — ${draft.name}`.slice(0, 100),
          page_id: draft.page_id,
          message: draft.message || '',
          link: draft.link,
          image_hash: draft.image_hash,
          video_id: draft.video_id,
          video_thumbnail_url: draft.video_thumbnail_url,
          headline: draft.headline || undefined,
          cta_type: draft.cta_type || undefined,
        });

  const adId = await createAd(accountId, token, {
    name: draft.name,
    adset_id: adsetId,
    creative_id: creativeId,
    status,
  });

  return {
    batch: false,
    ad_id: adId,
    creative_id: creativeId,
    status,
    ad_manager_url: `https://business.facebook.com/adsmanager/manage/ads?act=${accountId}&selected_ad_ids=${adId}`,
  };
}
