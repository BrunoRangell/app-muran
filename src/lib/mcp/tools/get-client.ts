import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "get_client",
  title: "Obter cliente",
  description: "Retorna dados completos de um cliente por id, incluindo contas de anúncio vinculadas.",
  inputSchema: {
    clientId: z.string().uuid().describe("UUID do cliente."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ clientId }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const [{ data: client, error: clientError }, { data: accounts, error: accountsError }] = await Promise.all([
      supabase.from("clients").select("*").eq("id", clientId).maybeSingle(),
      supabase.from("client_accounts").select("id, account_id, account_name, platform, status, is_primary").eq("client_id", clientId),
    ]);
    if (clientError) return { content: [{ type: "text", text: `Erro: ${clientError.message}` }], isError: true };
    if (!client) return { content: [{ type: "text", text: "Cliente não encontrado" }], isError: true };
    const payload = { client, accounts: accountsError ? [] : (accounts ?? []) };
    return {
      content: [{ type: "text", text: JSON.stringify(payload) }],
      structuredContent: payload,
    };
  },
});
