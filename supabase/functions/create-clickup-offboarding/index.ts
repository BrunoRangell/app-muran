import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

interface CreateClickUpOffboardingRequest {
  clientName: string;
  clientId: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    console.log("🚀 [CLICKUP-OFFBOARDING] Iniciando criação de offboarding no ClickUp");

    const { clientName, clientId }: CreateClickUpOffboardingRequest = await req.json();

    if (!clientName || !clientId) {
      throw new Error("clientName e clientId são obrigatórios");
    }

    console.log(`📋 Cliente: ${clientName} (${clientId})`);

    // Credenciais
    const clickupToken = Deno.env.get("CLICKUP_TOKEN");
    const clickupSpaceId = Deno.env.get("CLICKUP_SPACE_ID");
    const offboardingTemplateListId = Deno.env.get("CLICKUP_OFFBOARDING_TEMPLATE_LIST_ID");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!clickupToken || !clickupSpaceId || !offboardingTemplateListId) {
      throw new Error("Variáveis de ambiente do ClickUp não configuradas");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Atualizar status para in_progress
    await supabase
      .from("offboarding")
      .update({ clickup_status: "in_progress" })
      .eq("client_id", clientId);

    const headers = {
      "Authorization": clickupToken,
      "Content-Type": "application/json",
    };

    // 1. Buscar todas as pastas do Space para encontrar a do cliente
    console.log(`🔍 Buscando pasta do cliente no Space ${clickupSpaceId}...`);
    
    const foldersResponse = await fetch(
      `https://api.clickup.com/api/v2/space/${clickupSpaceId}/folder`,
      { headers }
    );

    if (!foldersResponse.ok) {
      throw new Error(`Erro ao buscar pastas: ${foldersResponse.statusText}`);
    }

    const foldersData = await foldersResponse.json();
    const clientFolder = foldersData.folders?.find(
      (folder: any) => folder.name === clientName
    );

    if (!clientFolder) {
      throw new Error(`Pasta do cliente "${clientName}" não encontrada no ClickUp`);
    }

    console.log(`✅ Pasta encontrada: ${clientFolder.name} (${clientFolder.id})`);

    // 2. Criar lista "Offboarding" na pasta do cliente
    console.log(`📝 Criando lista Offboarding na pasta ${clientFolder.id}...`);
    
    const createListResponse = await fetch(
      `https://api.clickup.com/api/v2/folder/${clientFolder.id}/list`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: "Offboarding",
          content: `Lista de tarefas de offboarding para ${clientName}`,
          status: null,
          priority: null,
          assignee: null,
          due_date: null,
        }),
      }
    );

    if (!createListResponse.ok) {
      const errorText = await createListResponse.text();
      throw new Error(`Erro ao criar lista Offboarding: ${errorText}`);
    }

    const offboardingList = await createListResponse.json();
    console.log(`✅ Lista Offboarding criada: ${offboardingList.id}`);

    // 3. Buscar tarefas do template
    console.log(`📋 Buscando tarefas do template ${offboardingTemplateListId}...`);
    
    const tasksResponse = await fetch(
      `https://api.clickup.com/api/v2/list/${offboardingTemplateListId}/task`,
      { headers }
    );

    if (!tasksResponse.ok) {
      throw new Error(`Erro ao buscar tarefas do template: ${tasksResponse.statusText}`);
    }

    const tasksData = await tasksResponse.json();
    const templateTasks = tasksData.tasks || [];
    
    console.log(`📋 Encontradas ${templateTasks.length} tarefas no template`);

    // 4. Criar tarefas na lista de offboarding
    const taskCreationPromises = templateTasks.map(async (task: any) => {
      const taskName = task.name.replace(/Cliente/g, clientName);
      
      // Data de vencimento: meio-dia de hoje (UTC)
      const today = new Date();
      today.setUTCHours(12, 0, 0, 0);
      const dueDate = today.getTime();

      console.log(`➕ Criando tarefa: ${taskName}`);

      const createTaskResponse = await fetch(
        `https://api.clickup.com/api/v2/list/${offboardingList.id}/task`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            name: taskName,
            description: task.description || "",
            status: task.status?.status || "to do",
            priority: task.priority?.id || null,
            due_date: dueDate,
            start_date: null,
            notify_all: false,
          }),
        }
      );

      if (!createTaskResponse.ok) {
        console.error(`❌ Erro ao criar tarefa "${taskName}"`);
        return null;
      }

      const createdTask = await createTaskResponse.json();
      console.log(`✅ Tarefa criada: ${createdTask.id}`);
      return createdTask;
    });

    const createdTasks = await Promise.all(taskCreationPromises);
    const successCount = createdTasks.filter(t => t !== null).length;
    
    console.log(`✅ ${successCount}/${templateTasks.length} tarefas criadas com sucesso`);

    // Atualizar offboarding no Supabase
    await supabase
      .from("offboarding")
      .update({
        clickup_status: "completed",
        clickup_list_id: offboardingList.id,
        clickup_completed_at: new Date().toISOString(),
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("client_id", clientId);

    console.log("✅ [CLICKUP-OFFBOARDING] Processo concluído com sucesso");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Offboarding criado com sucesso no ClickUp",
        data: {
          listId: offboardingList.id,
          listUrl: offboardingList.url,
          tasksCreated: successCount,
          totalTasks: templateTasks.length,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("❌ [CLICKUP-OFFBOARDING] Erro:", error);

    // Tentar atualizar o status de erro no Supabase
    try {
      const { clientId } = await req.json();
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase
        .from("offboarding")
        .update({
          clickup_status: "failed",
          clickup_error: { message: error.message, timestamp: new Date().toISOString() },
          status: "failed",
        })
        .eq("client_id", clientId);
    } catch (updateError) {
      console.error("❌ Erro ao atualizar status de erro:", updateError);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
