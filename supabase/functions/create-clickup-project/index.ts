import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateClickUpRequest {
  clientName: string;
  clientId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientName, clientId }: CreateClickUpRequest = await req.json();

    console.log(`🚀 [CLICKUP] Iniciando criação de projeto para ${clientName}`);

    const CLICKUP_TOKEN = Deno.env.get('CLICKUP_TOKEN');
    const SPACE_ID = Deno.env.get('CLICKUP_SPACE_ID');
    const TEMPLATE_FOLDER_ID = Deno.env.get('CLICKUP_TEMPLATE_FOLDER_ID');

    if (!CLICKUP_TOKEN || !SPACE_ID || !TEMPLATE_FOLDER_ID) {
      throw new Error('ClickUp credentials not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Atualizar status para in_progress
    await supabase
      .from('onboarding')
      .update({ clickup_status: 'in_progress' })
      .eq('client_id', clientId);

    const clickupApi = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': CLICKUP_TOKEN,
      }
    };

    // 1. Criar nova pasta
    console.log(`📁 [CLICKUP] Criando pasta...`);
    const folderResponse = await fetch(`https://api.clickup.com/api/v2/space/${SPACE_ID}/folder`, {
      method: 'POST',
      headers: clickupApi.headers,
      body: JSON.stringify({ name: clientName })
    });

    if (!folderResponse.ok) {
      throw new Error(`Failed to create folder: ${await folderResponse.text()}`);
    }

    const newFolder = await folderResponse.json();
    console.log(`✅ [CLICKUP] Pasta criada: ${newFolder.id}`);

    // 2. Obter listas do template
    console.log(`📋 [CLICKUP] Buscando listas do template...`);
    const listsResponse = await fetch(`https://api.clickup.com/api/v2/folder/${TEMPLATE_FOLDER_ID}/list`, {
      headers: clickupApi.headers
    });

    const { lists: templateLists } = await listsResponse.json();
    console.log(`📋 [CLICKUP] ${templateLists.length} listas encontradas`);

    // 3. Criar listas e tarefas
    for (const templateList of templateLists) {
      console.log(`📝 [CLICKUP] Criando lista: ${templateList.name}`);
      
      const newListResponse = await fetch(`https://api.clickup.com/api/v2/folder/${newFolder.id}/list`, {
        method: 'POST',
        headers: clickupApi.headers,
        body: JSON.stringify({
          name: templateList.name,
          content: templateList.content || '',
          status: 'green'
        })
      });

      const newList = await newListResponse.json();

      // Obter tarefas do template
      const tasksResponse = await fetch(`https://api.clickup.com/api/v2/list/${templateList.id}/task`, {
        headers: clickupApi.headers
      });

      const { tasks } = await tasksResponse.json();
      console.log(`✅ [CLICKUP] ${tasks.length} tarefas para copiar`);

      // Criar tarefas na nova lista
      for (const task of tasks) {
        const updatedTaskName = task.name.replace('Cliente', clientName);
        
        let dueDate = task.due_date;
        if (task.list?.name === "Onboarding") {
          const now = new Date();
          dueDate = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12, 0, 0);
        }

        await fetch(`https://api.clickup.com/api/v2/list/${newList.id}/task`, {
          method: 'POST',
          headers: clickupApi.headers,
          body: JSON.stringify({
            name: updatedTaskName,
            description: task.description || '',
            assignees: task.assignees?.map((a: any) => a.id) || [],
            tags: task.tags || [],
            status: task.status?.status || 'to do',
            due_date: dueDate,
            due_date_time: task.due_date_time || false,
            custom_fields: task.custom_fields || []
          })
        });
      }

      // Configurar visualizações customizadas
      if (newList.name === 'Onboarding') {
        await fetch(`https://api.clickup.com/api/v2/list/${newList.id}/view`, {
          method: 'POST',
          headers: clickupApi.headers,
          body: JSON.stringify({
            name: 'Todas as tarefas',
            type: 'list',
            parent: { id: newList.id, type: 7 },
            grouping: { field: 'status', dir: 1, collapsed: [], ignore: false },
            sorting: { fields: [{ field: 'name', dir: 1, idx: 0 }] },
            columns: {
              fields: [
                { field: "status", idx: 0, width: 160 },
                { field: "assignee", idx: 1, width: 160 },
                { field: "dueDate", idx: 2, width: 160 },
                { field: "priority", idx: 3, width: 160 }
              ]
            }
          })
        });
      }
    }

    // Atualizar onboarding com sucesso
    await supabase
      .from('onboarding')
      .update({
        clickup_folder_id: newFolder.id,
        clickup_status: 'completed',
        clickup_completed_at: new Date().toISOString()
      })
      .eq('client_id', clientId);

    console.log(`🎉 [CLICKUP] Projeto criado com sucesso!`);

    return new Response(
      JSON.stringify({
        success: true,
        folderId: newFolder.id,
        folderLink: `https://app.clickup.com/${newFolder.id}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ [CLICKUP] Erro:', error);

    // Atualizar onboarding com erro
    try {
      const { clientId } = await req.json();
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase
        .from('onboarding')
        .update({
          clickup_status: 'failed',
          clickup_error: { message: error.message, timestamp: new Date().toISOString() }
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
