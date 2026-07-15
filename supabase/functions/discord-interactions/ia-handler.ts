// Orquestra o comando /ia: resolve cliente, busca alvos, chama Claude, insere pending e pede confirmação.
// Também trata cliques dos botões (confirm/cancel).

import { createClient } from 'npm:@supabase/supabase-js@2';
import { fetchChannelName, resolveClientsByChannelName, channelNameToSearch } from './ia-client-resolve.ts';
import { fetchTargetsForClient, type Target } from './ia-targets.ts';
import { interpretarComandoIA } from './ia-claude.ts';
import { metaSetStatus, metaSetDailyBudget, googleSetStatus, googleSetDailyBudget } from './ia-writes.ts';

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

async function editMessage(appId: string, token: string, messageId: string, payload: unknown) {
  // Para MESSAGE_COMPONENT, editar @original também funciona.
  const url = `https://discord.com/api/v10/webhooks/${appId}/${token}/messages/@original`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) console.error('[ia editMessage]', res.status, await res.text());
}

function acaoLabel(a: string) {
  return a === 'pausar' ? 'pausar' : a === 'ativar' ? 'ativar' : 'mudar orçamento';
}

function nivelLabel(n: string) {
  return n === 'anuncio' ? 'anúncio' : n === 'adset' ? 'conjunto' : 'campanha';
}

function formatBRL(v: number | null | undefined) {
  if (v === null || v === undefined) return '—';
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

    if (decisao.confianca === 'nao_encontrado' || !decisao.acao || !decisao.item_id) {
      await editOriginal(appId, interactionToken, {
        content: `🤔 Não consegui identificar a ação para **${client.company_name}**.\n${decisao.mensagem ? `> ${decisao.mensagem}\n` : ''}Tente reformular incluindo o nome exato do anúncio/conjunto/campanha.`,
      });
      return;
    }

    if (decisao.confianca === 'ambiguo') {
      const cand = (decisao.candidatos || []).slice(0, 8).map((c) => `• ${c.nome || c.id}`).join('\n');
      await editOriginal(appId, interactionToken, {
        content: `⚠️ Sua solicitação está ambígua para **${client.company_name}**.\n${decisao.mensagem ? `> ${decisao.mensagem}\n` : ''}Candidatos prováveis:\n${cand || '_(nenhum)_'}\n\nReformule especificando qual item.`,
      });
      return;
    }

    // 4) Validar item_id contra a lista real
    const target = targets.find((t) => t.id === decisao.item_id);
    if (!target) {
      await editOriginal(appId, interactionToken, {
        content: `❌ A IA sugeriu um item que não está na lista real. Tente novamente com o nome exato.`,
      });
      return;
    }

    if (decisao.acao === 'mudar_orcamento') {
      if (!decisao.novo_valor || decisao.novo_valor <= 0) {
        await editOriginal(appId, interactionToken, {
          content: `❌ Valor de orçamento inválido. Informe um número em reais (ex: "800").`,
        });
        return;
      }
      if (target.level === 'anuncio') {
        await editOriginal(appId, interactionToken, {
          content: `❌ Não dá pra mudar orçamento no nível de **anúncio** — orçamento fica em campanha ou conjunto.`,
        });
        return;
      }
      if (target.platform === 'google' && target.level === 'campanha' && !target.extra?.campaign_budget_resource) {
        await editOriginal(appId, interactionToken, {
          content: `❌ Não localizei o campaign_budget vinculado à campanha do Google. Não posso ajustar o orçamento.`,
        });
        return;
      }
    }

    // 5) Snapshot + inserir pending
    const snapshot: any = {
      status: target.status,
      budget_amount_brl: target.budget_amount,
      budget_type: target.budget_type,
      resource_name: target.resource_name,
      account_id: target.account_id,
      extra: target.extra,
    };

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

    const reqId = inserted.id;

    // 6) Confirmação
    let descricao = '';
    const plataformaLabel = target.platform === 'meta' ? 'Meta Ads' : 'Google Ads';

    if (decisao.acao === 'pausar') {
      descricao = `Vou **pausar** o ${nivelLabel(target.level)} **${target.name}** — status atual: \`${target.status}\` → \`PAUSED\``;
    } else if (decisao.acao === 'ativar') {
      const alvo = target.platform === 'meta' ? 'ACTIVE' : 'ENABLED';
      descricao = `Vou **ativar** o ${nivelLabel(target.level)} **${target.name}** — status atual: \`${target.status}\` → \`${alvo}\``;
    } else {
      descricao = `Vou **mudar o orçamento diário** do ${nivelLabel(target.level)} **${target.name}** — ${formatBRL(target.budget_amount)}/dia → **${formatBRL(decisao.novo_valor!)}/dia**`;
    }

    await editOriginal(appId, interactionToken, {
      content: '',
      embeds: [
        {
          title: '🤖 Confirmação de ação via IA',
          description: descricao,
          color: MURAN_ORANGE,
          fields: [
            { name: 'Cliente', value: client.company_name, inline: true },
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
    });
  } catch (e: any) {
    console.error('[ia-handler] erro', e);
    await editOriginal(appId, interactionToken, {
      content: `⚠️ Erro: ${e?.message || 'falha desconhecida'}`,
    });
  }
}

// ============== Botões ==============

export async function handleIaButton(
  appId: string,
  interactionToken: string,
  customId: string,
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
    await editMessage(appId, interactionToken, '', {
      content: '❌ Solicitação não encontrada ou expirada.',
      components: [],
      embeds: [],
    });
    return;
  }

  if (row.status !== 'pending') {
    await editMessage(appId, interactionToken, '', {
      content: `ℹ️ Esta solicitação já foi processada (status: ${row.status}).`,
      components: [],
    });
    return;
  }

  if (prefix === 'ia_cancel') {
    await supabase
      .from('bot_action_requests')
      .update({ status: 'cancelled', executed_at: new Date().toISOString() })
      .eq('id', reqId);
    await editMessage(appId, interactionToken, '', {
      content: `❌ Ação cancelada — **${row.target_name}** não foi alterado.`,
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
      await editMessage(appId, interactionToken, '', {
        content: `✅ **${row.target_name}** ${acaoTxt} com sucesso.`,
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
      await editMessage(appId, interactionToken, '', {
        content: `⚠️ Falha ao executar em **${row.target_name}**: ${e?.message || 'erro desconhecido'}`,
        components: [],
        embeds: [],
      });
    }
  }
}
