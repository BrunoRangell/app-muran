// Registra (ou atualiza) os slash commands globais da aplicação no Discord.
// Rode 1x manualmente após criar/alterar comandos.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const COMMANDS = [
  {
    name: 'ia',
    description: 'Executa uma ação (pausar/ativar/orçamento) via IA — descreva o que quer fazer',
    options: [
      {
        name: 'comando',
        description: 'Ex: "pausar o anúncio xpto" ou "mudar orçamento da campanha Y pra 800/dia"',
        type: 3,
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
