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
  name: "list_budget_reviews",
  title: "Listar revisões de orçamento",
  description: "Lista revisões diárias de orçamento (Meta/Google) com filtros por cliente, plataforma e data.",
  inputSchema: {
    clientId: z.string().uuid().optional().describe("Filtrar por UUID do cliente."),
    platform: z.enum(["meta", "google"]).optional().describe("Filtrar por plataforma."),
    reviewDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Data da revisão no formato YYYY-MM-DD. Se omitido, retorna as mais recentes."),
    limit: z.number().int().min(1).max(200).optional().describe("Máximo de linhas (padrão 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ clientId, platform, reviewDate, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("budget_reviews")
      .select("id, client_id, platform, account_id, review_date, daily_budget_current, total_spent, last_five_days_spent, using_custom_budget, custom_budget_amount")
      .order("review_date", { ascending: false })
      .limit(limit ?? 50);
    if (clientId) query = query.eq("client_id", clientId);
    if (platform) query = query.eq("platform", platform);
    if (reviewDate) query = query.eq("review_date", reviewDate);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: `Erro: ${error.message}` }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { reviews: data ?? [] },
    };
  },
});
