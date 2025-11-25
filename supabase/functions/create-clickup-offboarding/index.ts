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
  folderId?: string; // Opcional: pasta já selecionada pelo usuário
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  let clientId = "";
  
  try {
    console.log("🚀 [CLICKUP-OFFBOARDING] Iniciando criação de offboarding no ClickUp");

    const requestBody: CreateClickUpOffboardingRequest = await req.json();
    const { clientName, folderId } = requestBody;
    clientId = requestBody.clientId;

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

    const headers = {
      "Authorization": clickupToken,
      "Content-Type": "application/json",
    };

    let clientFolder: any;

    // 1. Se já temos folderId, usar diretamente
    if (folderId) {
      console.log(`📁 Usando pasta selecionada: ${folderId}`);
      
      const folderResponse = await fetch(
        `https://api.clickup.com/api/v2/folder/${folderId}`,
        { headers }
      );

      if (!folderResponse.ok) {
        throw new Error(`Erro ao buscar pasta selecionada: ${folderResponse.statusText}`);
      }

      clientFolder = await folderResponse.json();
      console.log(`✅ Pasta confirmada: ${clientFolder.name} (${clientFolder.id})`);
    } else {
      // 2. Buscar pastas que correspondam ao nome do cliente (busca parcial)
      console.log(`🔍 Buscando pastas similares a "${clientName}" no Space ${clickupSpaceId}...`);
      
      // Buscar pastas ativas primeiro
      const activeFoldersResponse = await fetch(
        `https://api.clickup.com/api/v2/space/${clickupSpaceId}/folder?archived=false`,
        { headers }
      );

      if (!activeFoldersResponse.ok) {
        throw new Error(`Erro ao buscar pastas ativas: ${activeFoldersResponse.statusText}`);
      }

      const activeFoldersData = await activeFoldersResponse.json();
      const activeFolders = activeFoldersData.folders || [];

      // Buscar pastas arquivadas também
      const archivedFoldersResponse = await fetch(
        `https://api.clickup.com/api/v2/space/${clickupSpaceId}/folder?archived=true`,
        { headers }
      );

      if (!archivedFoldersResponse.ok) {
        throw new Error(`Erro ao buscar pastas arquivadas: ${archivedFoldersResponse.statusText}`);
      }

      const archivedFoldersData = await archivedFoldersResponse.json();
      const archivedFolders = archivedFoldersData.folders || [];

      // Combinar todas as pastas (ativas primeiro, depois arquivadas)
      const allFolders = [...activeFolders, ...archivedFolders];

      // Buscar correspondências (exata ou parcial), ignorando acentos/maiúsculas
      const normalize = (str: string) =>
        str
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();

      const clientNameNormalized = normalize(clientName);
      const matchingFolders = allFolders.filter((folder: any) => {
        const folderNameNormalized = normalize(folder.name || "");
        return (
          folderNameNormalized.includes(clientNameNormalized) ||
          clientNameNormalized.includes(folderNameNormalized)
        );
      });

      console.log(`📋 Encontradas ${matchingFolders.length} pasta(s) similar(es) de ${allFolders.length} total`);

      if (matchingFolders.length === 0) {
        console.log("⚠️ Nenhuma pasta similar encontrada. Retornando todas as pastas para seleção manual.");

        // Separar ativas de arquivadas para melhor UX
        const activeFoldersForUI = activeFolders.map((folder: any) => ({
          id: folder.id,
          name: folder.name,
          archived: false,
        }));

        const archivedFoldersForUI = archivedFolders.map((folder: any) => ({
          id: folder.id,
          name: folder.name,
          archived: true,
        }));

        return new Response(
          JSON.stringify({
            success: false,
            needsFolderSelection: true,
            folders: [...activeFoldersForUI, ...archivedFoldersForUI],
            noSimilarFolder: true,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      if (matchingFolders.length === 1) {
        // Apenas uma pasta encontrada, usar automaticamente
        clientFolder = matchingFolders[0];
        console.log(`✅ Pasta única encontrada: ${clientFolder.name} (${clientFolder.id})`);
      } else {
        // Múltiplas pastas encontradas, retornar para seleção
        console.log(`⚠️ Múltiplas pastas encontradas, requer seleção do usuário`);
        
        return new Response(
          JSON.stringify({
            success: false,
            needsFolderSelection: true,
            folders: matchingFolders.map((folder: any) => ({
              id: folder.id,
              name: folder.name,
              archived: folder.archived || false,
            })),
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
    }

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

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
