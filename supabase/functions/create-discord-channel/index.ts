import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateDiscordRequest {
  clientName: string;
  clientId: string;
  driveLink?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientName, clientId, driveLink }: CreateDiscordRequest = await req.json();

    console.log(`🚀 [DISCORD] Iniciando criação de canal para ${clientName}`);

    const DISCORD_TOKEN = Deno.env.get('DISCORD_TOKEN');
    const GUILD_ID = Deno.env.get('DISCORD_GUILD_ID');
    const CATEGORY_ID = Deno.env.get('DISCORD_CATEGORY_ID');

    if (!DISCORD_TOKEN || !GUILD_ID || !CATEGORY_ID) {
      throw new Error('Discord credentials not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Atualizar status para in_progress
    await supabase
      .from('onboarding')
      .update({ discord_status: 'in_progress' })
      .eq('client_id', clientId);

    const discordApi = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bot ${DISCORD_TOKEN}`
      }
    };

    // 1. Criar canal no Discord
    console.log(`💬 [DISCORD] Criando canal...`);
    const channelResponse = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/channels`, {
      method: 'POST',
      headers: discordApi.headers,
      body: JSON.stringify({
        name: clientName.toLowerCase().replace(/\s+/g, '-'),
        type: 0, // Text channel
        parent_id: CATEGORY_ID
      })
    });

    if (!channelResponse.ok) {
      throw new Error(`Failed to create channel: ${await channelResponse.text()}`);
    }

    const channel = await channelResponse.json();
    console.log(`✅ [DISCORD] Canal criado: ${channel.id}`);

    // 2. Enviar mensagem inicial
    console.log(`📨 [DISCORD] Enviando mensagem inicial...`);
    
    let messageContent = `🎉 Canal do cliente **${clientName}** criado com sucesso!\n\nBem-vindo ao seu espaço dedicado para acompanhamento e comunicação.`;
    
    if (driveLink) {
      messageContent += `\n\n📁 Pasta "${clientName}" criada com sucesso no Google Drive.\nLink da pasta: ${driveLink}`;
    }
    
    await fetch(`https://discord.com/api/v10/channels/${channel.id}/messages`, {
      method: 'POST',
      headers: discordApi.headers,
      body: JSON.stringify({
        content: messageContent
      })
    });

    const channelLink = `https://discord.com/channels/${GUILD_ID}/${channel.id}`;

    // Atualizar onboarding com sucesso
    await supabase
      .from('onboarding')
      .update({
        discord_channel_id: channel.id,
        discord_channel_link: channelLink,
        discord_status: 'completed',
        discord_completed_at: new Date().toISOString()
      })
      .eq('client_id', clientId);

    console.log(`🎉 [DISCORD] Canal criado com sucesso!`);

    return new Response(
      JSON.stringify({
        success: true,
        channelId: channel.id,
        channelLink
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ [DISCORD] Erro:', error);

    // Atualizar onboarding com erro
    try {
      const { clientId } = await req.json();
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase
        .from('onboarding')
        .update({
          discord_status: 'failed',
          discord_error: { message: error.message, timestamp: new Date().toISOString() }
        })
        .eq('client_id', clientId);
    } catch (e) {
      console.error('Erro ao atualizar status de erro:', e);
    }

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
