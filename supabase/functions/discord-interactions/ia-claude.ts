// Interpreta a solicitação em linguagem natural via Claude e devolve JSON estruturado.

import type { Target } from './ia-targets.ts';

export type ClaudeDecision = {
  confianca: 'confiante' | 'ambiguo' | 'nao_encontrado';
  acao?: 'pausar' | 'ativar' | 'mudar_orcamento';
  nivel?: 'anuncio' | 'adset' | 'campanha';
  item_id?: string;
  item_nome?: string;
  novo_valor?: number;
  candidatos?: Array<{ id?: string; nome?: string }>;
  mensagem?: string;
};

function parseJsonWithFences(text: string): any {
  const trimmed = text.trim();
  // remove markdown fences
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenceMatch ? fenceMatch[1] : trimmed;
  return JSON.parse(raw);
}

export async function interpretarComandoIA(
  comando: string,
  targets: Target[],
): Promise<ClaudeDecision> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY não configurada');

  // Compactar lista para o prompt
  const compacted = targets.map((t) => ({
    id: t.id,
    nome: t.name,
    plataforma: t.platform,
    nivel: t.level,
    status: t.status,
    orcamento_diario_brl: t.budget_type === 'daily' ? t.budget_amount : null,
    campanha_pai: t.hierarchy?.campaign_name || null,
    conjunto_pai: t.hierarchy?.adset_name || null,
  }));

  const system = `Você é um assistente que interpreta pedidos de gestores de tráfego em português e devolve JSON estruturado com a ação a executar em Meta Ads ou Google Ads.

Regras:
- Escolha SEMPRE um item que exista na lista fornecida. NUNCA invente um id.
- Se houver correspondência clara e única (mesmo com variações de escrita/acentos), use "confiante".
- Se houver mais de um item plausível, use "ambiguo" e preencha "candidatos" com nomes/ids dos prováveis.
- Se nada casar, use "nao_encontrado".
- Para "mudar_orcamento": interprete o valor como orçamento DIÁRIO em BRL (reais), a menos que a mensagem diga "total"/"vitalício" (aí ignore por enquanto e marque nao_encontrado com mensagem explicando).
- "pausar" / "ativar" mudam apenas o status.
- Retorne SÓ JSON, sem texto extra, sem markdown fences.

Schema:
{
  "confianca": "confiante" | "ambiguo" | "nao_encontrado",
  "acao": "pausar" | "ativar" | "mudar_orcamento",
  "nivel": "anuncio" | "adset" | "campanha",
  "item_id": "<id exato da lista>",
  "item_nome": "<nome exato>",
  "novo_valor": <número em BRL, só se mudar_orcamento>,
  "candidatos": [{"id":"...","nome":"..."}],
  "mensagem": "<explicação curta quando ambíguo/nao_encontrado>"
}`;

  const user = `Solicitação do gestor:
"${comando}"

Lista de alvos disponíveis (JSON):
${JSON.stringify(compacted)}

Devolva SÓ o JSON.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error('[ia-claude] erro', JSON.stringify(data));
    throw new Error(data?.error?.message || `Claude erro ${res.status}`);
  }
  const text = data?.content?.[0]?.text || '';
  try {
    return parseJsonWithFences(text) as ClaudeDecision;
  } catch (e) {
    console.error('[ia-claude] parse erro', text);
    throw new Error('Não foi possível interpretar a resposta da IA.');
  }
}
