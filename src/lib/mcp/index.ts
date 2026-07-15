import { auth, defineMcp } from "@lovable.dev/mcp-js";
import whoamiTool from "./tools/whoami";
import listClientsTool from "./tools/list-clients";
import getClientTool from "./tools/get-client";
import listBudgetReviewsTool from "./tools/list-budget-reviews";

// O emissor OAuth deve ser o host direto do Supabase (não o proxy .lovable.cloud).
// Lido de VITE_SUPABASE_PROJECT_ID (inline no build), mantendo o módulo import-safe.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "muran-app-mcp",
  title: "Muran App MCP",
  version: "0.1.0",
  instructions:
    "Ferramentas do Muran APP para consultar clientes, contas de anúncio e revisões diárias de orçamento (Meta Ads e Google Ads). Todas as leituras respeitam o usuário autenticado e as políticas de RLS do Supabase.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [whoamiTool, listClientsTool, getClientTool, listBudgetReviewsTool],
});
