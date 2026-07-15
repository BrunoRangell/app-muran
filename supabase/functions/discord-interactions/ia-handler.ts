// Orquestra o comando /ia: resolve cliente, busca alvos, chama Claude, insere pending e pede confirmação.
// Também trata cliques dos botões (confirm/cancel) e seleção de candidatos (pick).

import { createClient } from 'npm:@supabase/supabase-js@2';
import { fetchChannelName, resolveClientsByChannelName, channelNameToSearch } from './ia-client-resolve.ts';
import { fetchTargetsForClient, type Target } from './ia-targets.ts';
import { interpretarComandoIA } from './ia-claude.ts';
import { metaSetStatus, metaSetDailyBudget, googleSetStatus, googleSetDailyBudget } from './ia-writes.ts';
import { buildCampaignsListPayload, buildAdSetsListPayload, buildAdsListPayload } from './ia-listing.ts';

const MURAN_ORANGE = 0xff6e00;

async function editOriginal(appId: string, token: string, payload: unknown) {
  const url = `https://discord.com/api/v10/webhooks/${appId}/${token}/messages/@original`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) console.error('[ia editOriginal]', res.status, await res.text());
}

const editMessage = editOriginal;

function nivelLabel(n: string) {
  return n === 'anuncio' ? 'anúncio' : n === 'adset' ? 'conjunto' : 'campanha';
}

function statusLabelShort(s: string) {
  const up = (s || '').toUpperCase();
  if (up === 'ACTIVE' || up === 'ENABLED') return 'ativo';
  if (up === 'PAUSED') return 'pausado';
  return (s || '').toLowerCase();
}

function formatBRL(v: number | null | undefined) {
  if (v === null || v === undefined) return '—';
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function hierarchyPath(target: Target): string {
  return formatHierarchyPath(target.hierarchy, target.level, target.name);
}

function formatHierarchyPath(
  hierarchy: { campaign_name?: string; adset_name?: string } | null | undefined,
  level: string | null | undefined,
  name: string | null | undefined,
): string {
  const h = hierarchy || {};
  const lines: string[] = [];
  if (h.campaign_name) lines.push(`**Campanha:** ${h.campaign_name}`);
  if (h.adset_name) lines.push(`**Conjunto:** ${h.adset_name}`);
  const selfLabel =
    level === 'campanha' ? 'Campanha' : level === 'adset' ? 'Conjunto' : 'Anúncio';
  lines.push(`**${selfLabel}:** ${name || 'item'}`);
  return lines.join('\n');
}

function buildConfirmationPayload(
  clientName: string,
  target: Target,
  action: 'pausar' | 'ativar' | 'mudar_orcamento',
  newValue: number | null | undefined,
  discordUser: string,
  reqId: string,
) {
  const plataformaLabel = target.platform === 'meta' ? 'Meta Ads' : 'Google Ads';
  const path = hierarchyPath(target);
  let acaoTxt = '';
  if (action === 'pausar') {
    acaoTxt = `Vou **pausar** este ${nivelLabel(target.level)} — status atual: \`${target.status}\` → \`PAUSED\``;
  } else if (action === 'ativar') {
    const alvo = target.platform === 'meta' ? 'ACTIVE' : 'ENABLED';
    acaoTxt = `Vou **ativar** este ${nivelLabel(target.level)} — status atual: \`${target.status}\` → \`${alvo}\``;
  } else {
    acaoTxt = `Vou **mudar o orçamento diário** deste ${nivelLabel(target.level)} — ${formatBRL(target.budget_amount)}/dia → **${formatBRL(newValue!)}/dia**`;
  }
  const descricao = `${path}\n\n${acaoTxt}`;

  return {
    content: '',
    embeds: [
      {
        title: '🤖 Confirmação de ação via IA',
        description: descricao,
        color: MURAN_ORANGE,
        fields: [
          { name: 'Cliente', value: clientName, inline: true },
          { name: 'Plataforma', value: plataformaLabel, inline: true },
          { name: 'Nível', value: nivelLabel(target.level), inline: true },
        ],
        footer: { text: `Solicitado por ${discordUser}` },
      },
    ],
    components: [
      {
        type: 1,
        components: [
          { type: 2, style: 3, label: '✅ Confirmar', custom_id: `ia_confirm:${reqId}` },
          { type: 2, style: 4, label: '❌ Cancelar', custom_id: `ia_cancel:${reqId}` },
        ],
      },
    ],
  };
}

// ============== "Awaiting value" flow (modal) ==============

export function parseBRL(input: string | null | undefined): number | null {
  if (input == null) return null;
  let x = String(input).replace(/R\$/gi, '').replace(/\s/g, '').trim();
  if (!x) return null;
  if (x.includes(',')) {
    // formato pt-BR: pontos = milhar, vírgula = decimal
    x = x.replace(/\./g, '').replace(',', '.');
  }
  const n = parseFloat(x);
  if (!isFinite(n) || n <= 0) return null;
  return Math.round(n * 100) / 100;
}

function buildAskValuePayload(
  clientName: string,
  hierarchy: any,
  level: string,
  targetName: string,
  currentBudget: number | null | undefined,
  reqId: string,
) {
  const path = formatHierarchyPath(hierarchy, level, targetName);
  const atual = currentBudget != null
    ? `Orçamento diário atual: **${formatBRL(currentBudget)}/dia**`
    : `Orçamento diário atual: _não identificado_`;
  return {
    content: '',
    embeds: [
      {
        title: '💰 Faltou informar o novo orçamento',
        description: `${path}\n\n${atual}\n\nClique no botão abaixo para informar o novo valor.`,
        color: MURAN_ORANGE,
        fields: [{ name: 'Cliente', value: clientName, inline: true }],
      },
    ],
    components: [
      {
        type: 1,
        components: [
          { type: 2, style: 1, label: '💰 Informar novo orçamento', custom_id: `ia_ask_value:${reqId}` },
          { type: 2, style: 4, label: '❌ Cancelar', custom_id: `ia_cancel:${reqId}` },
        ],
      },
    ],
  };
}

// Modal payload — devolvido SÍNCRONO como resposta type=9 pela interação de botão.
export function buildValueModal(reqId: string, errorHint?: string) {
  return {
    type: 9,
    data: {
      custom_id: `ia_value_modal:${reqId}`,
      title: 'Novo orçamento diário',
      components: [
        {
          type: 1,
          components: [
            {
              type: 4, // TEXT_INPUT
              custom_id: 'novo_valor',
              style: 1, // SHORT
              label: errorHint || 'Novo orçamento diário (R$)',
              placeholder: 'Ex: 800  ou  R$ 1.200,50',
              required: true,
              min_length: 1,
              max_length: 20,
            },
          ],
        },
      ],
    },
  };
}



export async function handleIaCommand(
  appId: string,
  interactionToken: string,
  comando: string,
  channelId: string,
  channelNameFromPayload: string | undefined,
  discordUser: string,
  supabase: ReturnType<typeof createClient>,
) {
  try {
    // 1) Resolver canal -> cliente
    let channelName = channelNameFromPayload;
    if (!channelName) channelName = (await fetchChannelName(channelId)) || undefined;

    if (!channelName) {
      await editOriginal(appId, interactionToken, {
        content: '❌ Não foi possível identificar o canal. Use `/ia` dentro do canal do cliente.',
      });
      return;
    }

    const clients = await resolveClientsByChannelName(supabase, channelName);
    if (clients.length === 0) {
      await editOriginal(appId, interactionToken, {
        content: `❌ Não encontrei nenhum cliente ativo correspondente ao canal **#${channelName}** (busca: "${channelNameToSearch(channelName)}"). Renomeie o canal ou execute o comando no canal do cliente.`,
      });
      return;
    }
    if (clients.length > 1) {
      const nomes = clients.slice(0, 10).map((c: any) => `• ${c.company_name}`).join('\n');
      await editOriginal(appId, interactionToken, {
        content: `⚠️ Encontrei mais de um cliente possível para **#${channelName}**:\n${nomes}\n\nEspecifique melhor o nome do canal ou execute no canal correto.`,
      });
      return;
    }

    const client = clients[0] as any;

    // 2) Buscar alvos reais
    const { targets, errors } = await fetchTargetsForClient(supabase, client.id);
    if (!targets.length) {
      const errStr = errors.length ? `\n\nErros: ${errors.join(' | ')}` : '';
      await editOriginal(appId, interactionToken, {
        content: `❌ Nenhuma campanha/conjunto/anúncio ativo encontrado para **${client.company_name}**.${errStr}`,
      });
      return;
    }

    // 3) Claude interpreta
    const decisao = await interpretarComandoIA(comando, targets);

    if (decisao.confianca === 'nao_encontrado' || !decisao.acao) {
      await editOriginal(appId, interactionToken, {
        content: `🤔 Não consegui identificar a ação para **${client.company_name}**.\n${decisao.mensagem ? `> ${decisao.mensagem}\n` : ''}Tente reformular incluindo o nome exato do anúncio/conjunto/campanha.`,
      });
      return;
    }

    // ===== Consultas de LEITURA (sem confirmação) =====
    if (
      decisao.acao === 'listar_campanhas' ||
      decisao.acao === 'listar_conjuntos' ||
      decisao.acao === 'listar_anuncios'
    ) {
      const plat = decisao.plataforma_filtro || null;
      const statusF = decisao.status_filtro && decisao.status_filtro !== 'todos' ? decisao.status_filtro : null;
      let filtered = plat ? targets.filter((t) => t.platform === plat) : targets;
      if (statusF === 'ativo') {
        filtered = filtered.filter((t) => {
          const s = (t.status || '').toUpperCase();
          return s === 'ACTIVE' || s === 'ENABLED';
        });
      } else if (statusF === 'pausado') {
        filtered = filtered.filter((t) => (t.status || '').toUpperCase() === 'PAUSED');
      }
      let payload: unknown;
      if (decisao.acao === 'listar_campanhas') {
        payload = buildCampaignsListPayload(client.company_name, filtered, statusF);
      } else if (decisao.acao === 'listar_conjuntos') {
        payload = buildAdSetsListPayload(client.company_name, filtered, statusF);
      } else {
        payload = await buildAdsListPayload(supabase, client.company_name, filtered, statusF);
      }
      await editOriginal(appId, interactionToken, payload);
      return;
    }

    // ===== Caso AMBÍGUO: menu de seleção =====
    if (decisao.confianca === 'ambiguo') {
      // Mapear candidatos sugeridos para targets reais
      const candIds = new Set((decisao.candidatos || []).map((c) => c.id).filter(Boolean));
      let candidates: Target[] = targets.filter((t) => candIds.has(t.id));
      // Fallback: se a IA não trouxe ids válidos, tentar por nome
      if (!candidates.length && decisao.candidatos?.length) {
        const names = (decisao.candidatos || []).map((c) => (c.nome || '').toLowerCase());
        candidates = targets.filter((t) => names.some((n) => n && t.name.toLowerCase().includes(n)));
      }
      candidates = candidates.slice(0, 25);

      if (!candidates.length) {
        await editOriginal(appId, interactionToken, {
          content: `🤔 A IA achou o pedido ambíguo, mas não consegui mapear os candidatos. ${decisao.mensagem ? `\n> ${decisao.mensagem}` : ''}\nTente reformular com o nome exato.`,
        });
        return;
      }

      // Persistir estado ambíguo
      const { data: inserted, error: insErr } = await supabase
        .from('bot_action_requests')
        .insert({
          client_id: client.id,
          platform: candidates[0].platform,
          level: null,
          target_id: null,
          target_name: null,
          action: decisao.acao,
          new_value: decisao.acao === 'mudar_orcamento' ? decisao.novo_valor : null,
          comando,
          candidates_snapshot: candidates,
          requested_by_discord_user: discordUser,
          channel_id: channelId,
          status: 'ambiguous',
        })
        .select('id')
        .single();

      if (insErr || !inserted) {
        console.error('[ia-handler insert ambiguous]', insErr);
        await editOriginal(appId, interactionToken, {
          content: `⚠️ Erro ao registrar a solicitação: ${insErr?.message || 'desconhecido'}`,
        });
        return;
      }

      const reqId = inserted.id;
      const options = candidates.map((t) => {
        const h = t.hierarchy || {};
        const parentBits: string[] = [];
        if (h.campaign_name) parentBits.push(h.campaign_name);
        if (h.adset_name) parentBits.push(h.adset_name);
        const parentDesc = parentBits.length ? `${parentBits.join(' › ')} · ` : '';
        return {
          label: `${t.name} (${statusLabelShort(t.status)})`.slice(0, 100),
          description: `${parentDesc}${nivelLabel(t.level)} · ${t.platform === 'meta' ? 'Meta' : 'Google'}`.slice(0, 100),
          value: t.id,
        };
      });

      const acaoTxt =
        decisao.acao === 'mudar_orcamento'
          ? `mudar o orçamento diário para **${formatBRL(decisao.novo_valor!)}/dia**`
          : `**${decisao.acao}**`;

      await editOriginal(appId, interactionToken, {
        content: `⚠️ Encontrei **${candidates.length}** itens compatíveis para ${acaoTxt} em **${client.company_name}**. Escolha qual:`,
        embeds: [],
        components: [
          {
            type: 1,
            components: [
              {
                type: 3, // STRING_SELECT
                custom_id: `ia_pick:${reqId}`,
                placeholder: 'Selecione o item',
                options,
              },
            ],
          },
        ],
      });
      return;
    }

    // ===== Caso CONFIANTE =====
    if (!decisao.item_id) {
      await editOriginal(appId, interactionToken, {
        content: `🤔 A IA não retornou um item específico. Reformule com o nome exato.`,
      });
      return;
    }

    const target = targets.find((t) => t.id === decisao.item_id);
    if (!target) {
      await editOriginal(appId, interactionToken, {
        content: `❌ A IA sugeriu um item que não está na lista real. Tente novamente com o nome exato.`,
      });
      return;
    }

    // Caso especial conversacional: mudar_orcamento sem novo_valor válido → pedir via modal
    const needsValue =
      decisao.acao === 'mudar_orcamento' &&
      (decisao.novo_valor == null || !isFinite(Number(decisao.novo_valor)) || Number(decisao.novo_valor) <= 0);

    if (needsValue) {
      // Validar que o item é elegível para mudar orçamento (nível/plataforma), antes de pedir valor
      const structuralErr = validateActionStructural(decisao.acao, target);
      if (structuralErr) {
        await editOriginal(appId, interactionToken, { content: structuralErr });
        return;
      }

      const snapshot = buildSnapshot(target);
      const { data: inserted, error: insErr } = await supabase
        .from('bot_action_requests')
        .insert({
          client_id: client.id,
          platform: target.platform,
          level: target.level,
          target_id: target.id,
          target_name: target.name,
          action: decisao.acao,
          new_value: null,
          previous_value_snapshot: snapshot,
          hierarchy_snapshot: target.hierarchy || null,
          comando,
          requested_by_discord_user: discordUser,
          channel_id: channelId,
          status: 'awaiting_value',
        })
        .select('id')
        .single();

      if (insErr || !inserted) {
        console.error('[ia-handler insert awaiting_value]', insErr);
        await editOriginal(appId, interactionToken, {
          content: `⚠️ Erro ao registrar a solicitação: ${insErr?.message || 'desconhecido'}`,
        });
        return;
      }

      await editOriginal(
        appId,
        interactionToken,
        buildAskValuePayload(client.company_name, target.hierarchy, target.level, target.name, target.budget_amount, inserted.id),
      );
      return;
    }

    const validationError = validateAction(decisao.acao, decisao.novo_valor, target);
    if (validationError) {
      await editOriginal(appId, interactionToken, { content: validationError });
      return;
    }

    const snapshot = buildSnapshot(target);

    const { data: inserted, error: insErr } = await supabase
      .from('bot_action_requests')
      .insert({
        client_id: client.id,
        platform: target.platform,
        level: target.level,
        target_id: target.id,
        target_name: target.name,
        action: decisao.acao,
        new_value: decisao.acao === 'mudar_orcamento' ? decisao.novo_valor : null,
        previous_value_snapshot: snapshot,
        hierarchy_snapshot: target.hierarchy || null,
        comando,
        requested_by_discord_user: discordUser,
        channel_id: channelId,
        status: 'pending',
      })
      .select('id')
      .single();

    if (insErr || !inserted) {
      console.error('[ia-handler insert]', insErr);
      await editOriginal(appId, interactionToken, {
        content: `⚠️ Erro ao registrar a solicitação: ${insErr?.message || 'desconhecido'}`,
      });
      return;
    }

    await editOriginal(
      appId,
      interactionToken,
      buildConfirmationPayload(client.company_name, target, decisao.acao, decisao.novo_valor, discordUser, inserted.id),
    );
  } catch (e: any) {
    console.error('[ia-handler] erro', e);
    await editOriginal(appId, interactionToken, {
      content: `⚠️ Erro: ${e?.message || 'falha desconhecida'}`,
    });
  }
}

function validateAction(
  acao: 'pausar' | 'ativar' | 'mudar_orcamento',
  novoValor: number | undefined,
  target: Target,
): string | null {
  if (acao === 'mudar_orcamento') {
    if (!novoValor || novoValor <= 0) {
      return `❌ Valor de orçamento inválido. Informe um número em reais (ex: "800").`;
    }
    if (target.level === 'anuncio') {
      return `❌ Não dá pra mudar orçamento no nível de **anúncio** — orçamento fica em campanha ou conjunto.`;
    }
    if (target.platform === 'google' && target.level === 'adset') {
      return `❌ No Google Ads o orçamento fica na **campanha**, não no conjunto (ad group). Peça pra mudar na campanha.`;
    }
    if (target.platform === 'google' && target.level === 'campanha' && !target.extra?.campaign_budget_resource) {
      return `❌ Não localizei o campaign_budget vinculado à campanha do Google. Não posso ajustar o orçamento.`;
    }
  }
  return null;
}

// Igual a validateAction, mas ignora ausência/valor de novoValor (usado quando ainda vamos pedir via modal).
function validateActionStructural(
  acao: 'pausar' | 'ativar' | 'mudar_orcamento',
  target: Target,
): string | null {
  if (acao !== 'mudar_orcamento') return null;
  if (target.level === 'anuncio') {
    return `❌ Não dá pra mudar orçamento no nível de **anúncio** — orçamento fica em campanha ou conjunto.`;
  }
  if (target.platform === 'google' && target.level === 'adset') {
    return `❌ No Google Ads o orçamento fica na **campanha**, não no conjunto (ad group). Peça pra mudar na campanha.`;
  }
  if (target.platform === 'google' && target.level === 'campanha' && !target.extra?.campaign_budget_resource) {
    return `❌ Não localizei o campaign_budget vinculado à campanha do Google. Não posso ajustar o orçamento.`;
  }
  return null;
}

function buildSnapshot(target: Target) {
  return {
    status: target.status,
    budget_amount_brl: target.budget_amount,
    budget_type: target.budget_type,
    resource_name: target.resource_name,
    account_id: target.account_id,
    extra: target.extra,
  };
}

// ============== Componentes (botões e select) ==============

export async function handleIaButton(
  appId: string,
  interactionToken: string,
  customId: string,
  interactionData: any,
  supabase: ReturnType<typeof createClient>,
) {
  const [prefix, reqId] = customId.split(':');
  if (!reqId) return;

  const { data: row, error } = await supabase
    .from('bot_action_requests')
    .select('*')
    .eq('id', reqId)
    .maybeSingle();

  if (error || !row) {
    console.error('[handleIaButton] lookup falhou', { reqId, customId, error });
    await editMessage(appId, interactionToken, {
      content: '❌ Solicitação não encontrada ou expirada.',
      components: [],
      embeds: [],
    });
    return;
  }

  // Nome do cliente (busca separada — não há FK declarada para embed)
  let clientCompanyName = 'cliente';
  if (row.client_id) {
    const { data: c } = await supabase
      .from('clients')
      .select('company_name')
      .eq('id', row.client_id)
      .maybeSingle();
    if (c?.company_name) clientCompanyName = c.company_name;
  }

  // ===== Seleção de candidato =====
  if (prefix === 'ia_pick') {
    if (row.status !== 'ambiguous') {
      await editMessage(appId, interactionToken, {
        content: `ℹ️ Esta solicitação já foi processada (status: ${row.status}).`,
        components: [],
      });
      return;
    }

    const chosenId: string | undefined = interactionData?.values?.[0];
    const candidates: Target[] = Array.isArray(row.candidates_snapshot) ? row.candidates_snapshot : [];
    const target = candidates.find((t) => t.id === chosenId);
    if (!target) {
      await editMessage(appId, interactionToken, {
        content: '❌ Item selecionado não encontrado na lista original.',
        components: [],
      });
      return;
    }

    const validationError = validateAction(row.action, row.new_value ? Number(row.new_value) : undefined, target);
    if (validationError) {
      await supabase.from('bot_action_requests').update({ status: 'failed', executed_at: new Date().toISOString(), result: { error: validationError } }).eq('id', reqId);
      await editMessage(appId, interactionToken, { content: validationError, components: [], embeds: [] });
      return;
    }

    const snapshot = buildSnapshot(target);
    await supabase
      .from('bot_action_requests')
      .update({
        status: 'pending',
        level: target.level,
        target_id: target.id,
        target_name: target.name,
        platform: target.platform,
        previous_value_snapshot: snapshot,
        hierarchy_snapshot: target.hierarchy || null,
      })
      .eq('id', reqId);

    const discordUser = row.requested_by_discord_user || 'gestor';
    await editMessage(
      appId,
      interactionToken,
      buildConfirmationPayload(clientCompanyName, target, row.action, row.new_value ? Number(row.new_value) : undefined, discordUser, reqId),
    );
    return;
  }

  // ===== Confirmar / Cancelar =====
  // Cancelar aceita tanto pending quanto awaiting_value; confirmar exige pending.
  const allowedStatuses = prefix === 'ia_cancel' ? ['pending', 'awaiting_value'] : ['pending'];
  if (!allowedStatuses.includes(row.status)) {
    await editMessage(appId, interactionToken, {
      content: `ℹ️ Esta solicitação já foi processada (status: ${row.status}).`,
      components: [],
    });
    return;
  }

  const rowPath = formatHierarchyPath(row.hierarchy_snapshot, row.level, row.target_name);

  if (prefix === 'ia_cancel') {
    await supabase
      .from('bot_action_requests')
      .update({ status: 'cancelled', executed_at: new Date().toISOString() })
      .eq('id', reqId);
    await editMessage(appId, interactionToken, {
      content: `❌ Ação cancelada — **${rowPath}** não foi alterado.`,
      components: [],
      embeds: [],
    });
    return;
  }

  if (prefix === 'ia_confirm') {
    try {
      const snap = row.previous_value_snapshot || {};
      let result: any;

      if (row.platform === 'meta') {
        if (row.action === 'pausar') {
          result = await metaSetStatus(supabase, row.target_id, 'PAUSED');
        } else if (row.action === 'ativar') {
          result = await metaSetStatus(supabase, row.target_id, 'ACTIVE');
        } else if (row.action === 'mudar_orcamento') {
          result = await metaSetDailyBudget(supabase, row.target_id, Number(row.new_value));
        }
      } else if (row.platform === 'google') {
        const customerId = snap.account_id;
        const resourceName = snap.resource_name;
        if (row.action === 'pausar') {
          result = await googleSetStatus(row.level, resourceName, customerId, 'PAUSED');
        } else if (row.action === 'ativar') {
          result = await googleSetStatus(row.level, resourceName, customerId, 'ENABLED');
        } else if (row.action === 'mudar_orcamento') {
          result = await googleSetDailyBudget(snap.extra?.campaign_budget_resource, customerId, Number(row.new_value));
        }
      }

      await supabase
        .from('bot_action_requests')
        .update({ status: 'executed', executed_at: new Date().toISOString(), result })
        .eq('id', reqId);

      const acaoTxt = row.action === 'pausar' ? 'pausado' : row.action === 'ativar' ? 'ativado' : `com orçamento alterado para ${formatBRL(Number(row.new_value))}/dia`;
      await editMessage(appId, interactionToken, {
        content: `✅ **${rowPath}** ${acaoTxt} com sucesso.`,
        components: [],
        embeds: [],
      });
    } catch (e: any) {
      console.error('[ia_confirm] erro', e);
      await supabase
        .from('bot_action_requests')
        .update({
          status: 'failed',
          executed_at: new Date().toISOString(),
          result: { error: e?.message || String(e) },
        })
        .eq('id', reqId);
      await editMessage(appId, interactionToken, {
        content: `⚠️ Falha ao executar em **${rowPath}**: ${e?.message || 'erro desconhecido'}`,
        components: [],
        embeds: [],
      });
    }
  }
}

// ============== Submissão de modal (informar novo orçamento) ==============

async function sendEphemeralError(appId: string, interactionToken: string, message: string) {
  const url = `https://discord.com/api/v10/webhooks/${appId}/${interactionToken}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: message, flags: 64 }),
  });
  if (!res.ok) console.error('[ia sendEphemeralError]', res.status, await res.text());
}

export async function handleIaModalSubmit(
  appId: string,
  interactionToken: string,
  customId: string,
  interactionData: any,
  supabase: ReturnType<typeof createClient>,
) {
  const [, reqId] = customId.split(':');
  if (!reqId) return;

  const rows: any[] = interactionData?.components || [];
  let raw = '';
  for (const row of rows) {
    for (const comp of row.components || []) {
      if (comp.custom_id === 'novo_valor') raw = comp.value || '';
    }
  }

  const parsed = parseBRL(raw);

  const { data: row, error } = await supabase
    .from('bot_action_requests')
    .select('*')
    .eq('id', reqId)
    .maybeSingle();

  if (error || !row) {
    console.error('[handleIaModalSubmit] lookup falhou', { reqId, error });
    await sendEphemeralError(appId, interactionToken, '❌ Solicitação não encontrada ou expirada. Rode `/ia` novamente.');
    return;
  }

  if (row.status !== 'awaiting_value') {
    await sendEphemeralError(appId, interactionToken, `ℹ️ Esta solicitação já foi processada (status: ${row.status}).`);
    return;
  }

  if (parsed == null) {
    await sendEphemeralError(
      appId,
      interactionToken,
      `❌ Valor inválido: \`${raw}\`. Clique novamente em **💰 Informar novo orçamento** e digite um número em reais (ex: \`800\` ou \`R$ 1.200,50\`).`,
    );
    return;
  }

  const { error: updErr } = await supabase
    .from('bot_action_requests')
    .update({ new_value: parsed, status: 'pending' })
    .eq('id', reqId);

  if (updErr) {
    console.error('[handleIaModalSubmit] update falhou', updErr);
    await sendEphemeralError(appId, interactionToken, `⚠️ Erro ao registrar o valor: ${updErr.message}`);
    return;
  }

  let clientCompanyName = 'cliente';
  if (row.client_id) {
    const { data: c } = await supabase.from('clients').select('company_name').eq('id', row.client_id).maybeSingle();
    if (c?.company_name) clientCompanyName = c.company_name;
  }

  const snap = row.previous_value_snapshot || {};
  const pseudoTarget: any = {
    platform: row.platform,
    level: row.level,
    id: row.target_id,
    name: row.target_name,
    status: snap.status,
    budget_amount: snap.budget_amount_brl,
    budget_type: snap.budget_type,
    resource_name: snap.resource_name,
    account_id: snap.account_id,
    extra: snap.extra,
    hierarchy: row.hierarchy_snapshot || {},
  };

  const discordUser = row.requested_by_discord_user || 'gestor';
  await editMessage(
    appId,
    interactionToken,
    buildConfirmationPayload(clientCompanyName, pseudoTarget, 'mudar_orcamento', parsed, discordUser, reqId),
  );
}
