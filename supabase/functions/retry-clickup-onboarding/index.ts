import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RetryRequest {
  clientName: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientName }: RetryRequest = await req.json();
    if (!clientName) throw new Error('clientName é obrigatório');

    console.log(`🔁 [CLICKUP-RETRY] Cliente: ${clientName}`);

    const CLICKUP_TOKEN = Deno.env.get('CLICKUP_TOKEN');
    const SPACE_ID = Deno.env.get('CLICKUP_SPACE_ID');
    const TEMPLATE_FOLDER_ID = Deno.env.get('CLICKUP_TEMPLATE_FOLDER_ID');

    if (!CLICKUP_TOKEN || !SPACE_ID || !TEMPLATE_FOLDER_ID) {
      throw new Error('ClickUp credentials not configured');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': CLICKUP_TOKEN,
    };

    // 1. Localizar pasta existente no Space
    const foldersRes = await fetch(
      `https://api.clickup.com/api/v2/space/${SPACE_ID}/folder?archived=false`,
      { headers }
    );
    if (!foldersRes.ok) {
      throw new Error(`Falha ao listar pastas: ${await foldersRes.text()}`);
    }
    const { folders } = await foldersRes.json();
    const normalize = (s: string) => s.trim().toLowerCase();
    const clientFolder = folders?.find(
      (f: any) => normalize(f.name) === normalize(clientName)
    );

    if (!clientFolder) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Pasta do cliente "${clientName}" não encontrada no ClickUp. Execute o onboarding completo primeiro.`,
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📁 [CLICKUP-RETRY] Pasta encontrada: ${clientFolder.id}`);

    // 2. Listas do template + listas existentes na pasta do cliente
    const [templateListsRes, clientListsRes] = await Promise.all([
      fetch(`https://api.clickup.com/api/v2/folder/${TEMPLATE_FOLDER_ID}/list`, { headers }),
      fetch(`https://api.clickup.com/api/v2/folder/${clientFolder.id}/list?archived=false`, { headers }),
    ]);

    if (!templateListsRes.ok) throw new Error(`Falha ao ler template: ${await templateListsRes.text()}`);
    if (!clientListsRes.ok) throw new Error(`Falha ao ler pasta do cliente: ${await clientListsRes.text()}`);

    const { lists: templateLists } = await templateListsRes.json();
    const { lists: existingLists } = await clientListsRes.json();

    const existingNames = new Set(
      (existingLists ?? []).map((l: any) => normalize(l.name))
    );

    const missingLists = (templateLists ?? []).filter(
      (l: any) => !existingNames.has(normalize(l.name))
    );

    console.log(
      `📊 [CLICKUP-RETRY] Template: ${templateLists.length} | Existentes: ${existingLists.length} | Faltando: ${missingLists.length}`
    );

    const summary = {
      created: [] as string[],
      skipped: (existingLists ?? []).map((l: any) => l.name),
      errors: [] as { list: string; error: string }[],
    };

    if (missingLists.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Nenhuma lista faltando. Tudo já está criado.',
          folderId: clientFolder.id,
          folderLink: `https://app.clickup.com/${clientFolder.id}`,
          summary,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Criar listas faltantes + tarefas
    for (const templateList of missingLists) {
      try {
        console.log(`📝 [CLICKUP-RETRY] Criando lista: ${templateList.name}`);

        const newListRes = await fetch(
          `https://api.clickup.com/api/v2/folder/${clientFolder.id}/list`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({
              name: templateList.name,
              content: templateList.content || '',
            }),
          }
        );

        if (!newListRes.ok) {
          const errText = await newListRes.text();
          console.error(`❌ [CLICKUP-RETRY] Falha lista ${templateList.name}:`, errText);
          summary.errors.push({ list: templateList.name, error: errText });
          // Se for limite de listas, aborta o restante para não spammar
          if (errText.includes('HLIMIT_005') || errText.includes('list limit')) {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'Limite de listas do Space no ClickUp atingido. Faça upgrade do plano ou arquive listas antigas antes de retentar.',
                code: 'HLIMIT_005',
                folderId: clientFolder.id,
                summary,
              }),
              { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          continue;
        }

        const newList = await newListRes.json();
        console.log(`✅ [CLICKUP-RETRY] Lista criada: ${newList.name}`);

        // Tarefas do template
        const tasksRes = await fetch(
          `https://api.clickup.com/api/v2/list/${templateList.id}/task`,
          { headers }
        );
        if (!tasksRes.ok) {
          summary.errors.push({
            list: templateList.name,
            error: `Falha ao ler tarefas do template: ${await tasksRes.text()}`,
          });
          summary.created.push(newList.name);
          continue;
        }

        const { tasks } = await tasksRes.json();
        let createdCount = 0;

        for (const task of tasks ?? []) {
          const updatedName = task.name.replace('Cliente', clientName);

          let dueDate = task.due_date;
          if (task.list?.name === 'Onboarding') {
            const now = new Date();
            dueDate = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12, 0, 0);
          }

          const payload = {
            name: updatedName,
            description: task.description || '',
            assignees: task.assignees?.map((a: any) => a.id) || [],
            tags: task.tags || [],
            status: task.status?.status || 'to do',
            due_date: dueDate,
            due_date_time: task.due_date_time || false,
          };

          const createRes = await fetch(
            `https://api.clickup.com/api/v2/list/${newList.id}/task`,
            {
              method: 'POST',
              headers,
              body: JSON.stringify(payload),
            }
          );

          if (createRes.ok) {
            createdCount++;
          } else {
            console.error(
              `❌ [CLICKUP-RETRY] Tarefa "${updatedName}":`,
              await createRes.text()
            );
          }

          await new Promise((r) => setTimeout(r, 100));
        }

        console.log(`🎯 [CLICKUP-RETRY] ${createdCount}/${tasks?.length ?? 0} tarefas em ${newList.name}`);
        summary.created.push(newList.name);
      } catch (err: any) {
        console.error(`❌ [CLICKUP-RETRY] Erro em ${templateList.name}:`, err);
        summary.errors.push({ list: templateList.name, error: err.message });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        folderId: clientFolder.id,
        folderLink: `https://app.clickup.com/${clientFolder.id}`,
        summary,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ [CLICKUP-RETRY] Erro crítico:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
