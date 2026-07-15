// Resolve o cliente a partir do canal em que o comando /ia foi invocado.
// Canais são criados como "nome-do-cliente-em-minusculo-com-hifen".

import { createClient } from 'npm:@supabase/supabase-js@2';

export async function fetchChannelName(channelId: string): Promise<string | null> {
  const token = Deno.env.get('DISCORD_TOKEN');
  if (!token || !channelId) return null;
  try {
    const res = await fetch(`https://discord.com/api/v10/channels/${channelId}`, {
      headers: { Authorization: `Bot ${token}` },
    });
    if (!res.ok) {
      console.error('[ia-client-resolve] fetchChannelName', res.status, await res.text());
      return null;
    }
    const data = await res.json();
    return data?.name || null;
  } catch (e) {
    console.error('[ia-client-resolve] fetchChannelName erro', e);
    return null;
  }
}

export function channelNameToSearch(name: string): string {
  // 1) Remove qualquer caractere decorativo (emoji, bullets, símbolos) — mantém letras, números, hífen e espaço.
  // 2) Converte hífens/underscores em espaço.
  // 3) Colapsa espaços e trima.
  const cleaned = name.replace(/[^\p{L}\p{N}\s-]/gu, '');
  return cleaned.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function resolveClientsByChannelName(
  supabase: ReturnType<typeof createClient>,
  channelName: string,
) {
  const search = channelNameToSearch(channelName);
  // Buscar por company_name similar (todas as palavras)
  const words = search.split(/\s+/).filter(Boolean);
  const pattern = `%${words.join('%')}%`;

  const { data, error } = await supabase
    .from('clients')
    .select('id, company_name, status')
    .eq('status', 'active')
    .ilike('company_name', pattern);

  if (error) throw error;
  return data || [];
}
