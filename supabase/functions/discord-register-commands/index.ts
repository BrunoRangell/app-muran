// Registra (ou atualiza) os slash commands globais da aplicação no Discord.
// Rode 1x manualmente após criar/alterar comandos.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const COMMANDS = [
  {
    name: 'anuncios',
    description: 'Lista os anúncios ativos do Meta Ads de um cliente',
    options: [
      {
        name: 'cliente',
        description: 'Nome (ou parte) do cliente',
        type: 3, // STRING
        required: true,
      },
    ],
  },
  {
    name: 'otimizacao',
    description: 'Gera análise de otimização com IA (Meta+Google, últimos 90 dias) para um cliente',
    options: [
      {
        name: 'cliente',
        description: 'Nome (ou parte) do cliente',
        type: 3, // STRING
        required: true,
      },
    ],
  },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const APP_ID = Deno.env.get('DISCORD_APPLICATION_ID');
  const BOT_TOKEN = Deno.env.get('DISCORD_TOKEN');

  if (!APP_ID || !BOT_TOKEN) {
    return new Response(
      JSON.stringify({ error: 'Faltam DISCORD_APPLICATION_ID ou DISCORD_TOKEN' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const url = `https://discord.com/api/v10/applications/${APP_ID}/commands`;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bot ${BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(COMMANDS),
  });

  const body = await res.text();
  return new Response(body, {
    status: res.status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
