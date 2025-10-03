import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateDriveRequest {
  clientName: string;
  clientId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientName, clientId }: CreateDriveRequest = await req.json();

    console.log(`🚀 [DRIVE] Iniciando criação de pasta para ${clientName}`);

    const PARENT_FOLDER_ID = Deno.env.get('GOOGLE_DRIVE_PARENT_FOLDER_ID');

    if (!PARENT_FOLDER_ID) {
      throw new Error('Google Drive parent folder not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Atualizar status para in_progress
    await supabase
      .from('onboarding')
      .update({ drive_status: 'in_progress' })
      .eq('client_id', clientId);

    // Buscar tokens do Google da tabela api_tokens
    const { data: tokens } = await supabase
      .from('api_tokens')
      .select('name, value')
      .in('name', ['google_ads_client_id', 'google_ads_client_secret', 'google_ads_refresh_token']);

    if (!tokens || tokens.length !== 3) {
      throw new Error('Google tokens not found in database');
    }

    const CLIENT_ID = tokens.find(t => t.name === 'google_ads_client_id')?.value;
    const CLIENT_SECRET = tokens.find(t => t.name === 'google_ads_client_secret')?.value;
    const REFRESH_TOKEN = tokens.find(t => t.name === 'google_ads_refresh_token')?.value;

    // Obter access token
    console.log(`🔑 [DRIVE] Obtendo access token...`);
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID!,
        client_secret: CLIENT_SECRET!,
        refresh_token: REFRESH_TOKEN!,
        grant_type: 'refresh_token'
      })
    });

    const { access_token } = await tokenResponse.json();

    const driveHeaders = {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    };

    // 1. Criar pasta principal
    console.log(`📁 [DRIVE] Criando pasta principal...`);
    const mainFolderResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: driveHeaders,
      body: JSON.stringify({
        name: clientName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [PARENT_FOLDER_ID]
      })
    });

    if (!mainFolderResponse.ok) {
      throw new Error(`Failed to create main folder: ${await mainFolderResponse.text()}`);
    }

    const mainFolder = await mainFolderResponse.json();
    console.log(`✅ [DRIVE] Pasta principal criada: ${mainFolder.id}`);

    // 2. Criar subpastas
    const subFolderNames = [
      'Criação',
      'Desenvolvimento WEB',
      'Mídia paga',
      'Relacionamento',
      'Vendas',
      'Pasta compartilhada'
    ];

    console.log(`📂 [DRIVE] Criando ${subFolderNames.length} subpastas...`);
    const createdSubfolders = [];

    for (const subFolderName of subFolderNames) {
      const subFolderResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: driveHeaders,
        body: JSON.stringify({
          name: subFolderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [mainFolder.id]
        })
      });

      const subFolder = await subFolderResponse.json();
      createdSubfolders.push(subFolderName);
      console.log(`✅ [DRIVE] Subpasta criada: ${subFolderName}`);
    }

    const folderLink = `https://drive.google.com/drive/folders/${mainFolder.id}`;

    // Atualizar onboarding com sucesso
    await supabase
      .from('onboarding')
      .update({
        drive_folder_id: mainFolder.id,
        drive_folder_link: folderLink,
        drive_subfolders: createdSubfolders,
        drive_status: 'completed',
        drive_completed_at: new Date().toISOString()
      })
      .eq('client_id', clientId);

    console.log(`🎉 [DRIVE] Pasta criada com sucesso!`);

    return new Response(
      JSON.stringify({
        success: true,
        folderId: mainFolder.id,
        folderLink,
        subfolders: createdSubfolders
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ [DRIVE] Erro:', error);

    // Atualizar onboarding com erro
    try {
      const { clientId } = await req.json();
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase
        .from('onboarding')
        .update({
          drive_status: 'failed',
          drive_error: { message: error.message, timestamp: new Date().toISOString() }
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
