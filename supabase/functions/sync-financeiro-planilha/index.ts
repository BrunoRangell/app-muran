// Lê a planilha "Financeiro Muran.xlsx" (Drive) e atualiza recebimentos e custos do App Muran.
// Abas: "Receitas {ano}" e "Despesas {ano}" (2024 em diante). Roda todo dia às 6h (cron) e pelo botão "Sincronizar agora".
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FILE_ID = "1PdMwP0uLmgl5twRGClox0jSiE1mleTiS";
const FIRST_YEAR = 2024;
const pad = (n: number) => String(n).padStart(2, "0");

/** "Dra. Irene Dantas", "CWR 1270", "Rosacruz (pós)" → chave comparável */
const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\b\d{3,}\b/g, " ")
    .replace(/\b(dra?|clinica|ltda|advogados|imoveis|negocios|imobiliarios|imobiliaria|confeccoes|colchoes|atelier)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const num = (v: unknown) => (typeof v === "number" && isFinite(v) ? v : typeof v === "string" && v.trim() !== "" && !isNaN(Number(v.replace(",", "."))) ? Number(v.replace(",", ".")) : 0);

const SKIP_REV = /^(receita total|total)/i;
const STOP_COST = /^(custo total|custo geral|receita total|caixa)/i;

/** categoria do App a partir da seção da planilha e do nome da despesa */
const categoryOf = (section: string, name: string): string => {
  const s = norm(section), n = norm(name);
  if (/ferrament/.test(s)) return "plataformas_ferramentas";
  if (/imposto/.test(s)) return "taxas_impostos";
  if (/trafego/.test(s)) return "marketing";
  if (/equipe/.test(s)) return /contabil/.test(n) ? "servicos_profissionais" : "despesas_pessoal";
  // custos extras
  if (/comiss/.test(n)) return "vendas";
  if (/doac/.test(n)) return "acoes_sociais";
  if (/trein|evento|mentoria|bni|siao|confratern|viag|grupo/.test(n)) return "eventos_networking";
  if (/placa|brinde|presente|foto|video|site|social media|cartao|camiset|uniforme|grafite/.test(n)) return "marketing";
  if (/taxa|mei|inpi|certificado|junta|cnpj/.test(n)) return "taxas_impostos";
  if (/lovable|e mail|email|chip|recarga/.test(n)) return "plataformas_ferramentas";
  if (/escritorio|aluguel|aliment|mercado|internet|ar condicionado|macbook|designer|gestor|programador|desenvolvedor|bdr|videomaker/.test(n)) return "despesas_pessoal";
  return "servicos_profissionais";
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const fail = async (msg: string, status = 500) => {
    await supabase.from("finance_sync_runs").insert({ status: "erro", summary: { erro: msg } });
    return new Response(JSON.stringify({ ok: false, error: "Falha na sincronização (detalhes no registro)" }), { status, headers: { ...cors, "Content-Type": "application/json" } });
  };

  try {
    // evita duas sincronizações seguidas (botão + cron)
    const { data: last } = await supabase.from("finance_sync_runs").select("ran_at, status").order("ran_at", { ascending: false }).limit(1).maybeSingle();
    if (last && last.status === "ok" && Date.now() - new Date(last.ran_at).getTime() < 60_000)
      return new Response(JSON.stringify({ ok: true, skipped: "sincronizado há menos de 1 minuto" }), { headers: { ...cors, "Content-Type": "application/json" } });

    // token do Google (o mesmo que o onboarding usa para criar pastas no Drive)
    const { data: tokens } = await supabase.from("api_tokens").select("name, value").in("name", ["google_ads_client_id", "google_ads_client_secret", "google_ads_refresh_token"]);
    const t = (k: string) => tokens?.find((x) => x.name === k)?.value;
    if (!t("google_ads_refresh_token")) return await fail("Tokens do Google não encontrados");
    const tok = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: t("google_ads_client_id")!, client_secret: t("google_ads_client_secret")!, refresh_token: t("google_ads_refresh_token")!, grant_type: "refresh_token" }),
    }).then((r) => r.json());
    if (!tok.access_token) return await fail("Não consegui o acesso ao Google: " + JSON.stringify(tok).slice(0, 200));

    const file = await fetch(`https://www.googleapis.com/drive/v3/files/${FILE_ID}?alt=media&supportsAllDrives=true`, {
      headers: { Authorization: `Bearer ${tok.access_token}` },
    });
    if (!file.ok) return await fail(`Não consegui baixar a planilha (${file.status}): ${(await file.text()).slice(0, 200)}`);
    const wb = XLSX.read(new Uint8Array(await file.arrayBuffer()), { type: "array" });

    // clientes e apelidos
    const { data: clients } = await supabase.from("clients").select("id, company_name, contract_value");
    const { data: aliases } = await supabase.from("finance_sheet_aliases").select("sheet_name, client_ids");
    const byNorm = new Map<string, { id: string; contract_value: number }>();
    for (const c of clients ?? []) byNorm.set(norm(c.company_name), { id: c.id, contract_value: Number(c.contract_value) || 0 });
    const aliasMap = new Map<string, string[]>();
    for (const a of aliases ?? []) aliasMap.set(norm(a.sheet_name), a.client_ids ?? []);
    const contractOf = (id: string) => (clients ?? []).find((c) => c.id === id)?.contract_value ?? 0;

    const years: number[] = [];
    const payments: Record<string, unknown>[] = [];
    const costs: Record<string, unknown>[] = [];
    const unmatched = new Set<string>();

    for (const sheetName of wb.SheetNames) {
      const mRev = sheetName.trim().match(/^Receitas (\d{4})$/i);
      const mCost = sheetName.trim().match(/^Despesas (\d{4})$/i);
      const year = Number((mRev ?? mCost)?.[1]);
      if (!year || year < FIRST_YEAR) continue;
      if (!years.includes(year)) years.push(year);
      const rows: unknown[][] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, raw: true, defval: null });

      if (mRev) {
        for (const r of rows.slice(1)) {
          const name = typeof r[1] === "string" ? r[1].trim() : "";
          if (!name || SKIP_REV.test(name) || /^clientes (ativos|inativos)$/i.test(name)) continue;
          const key = norm(name);
          const ids = aliasMap.get(key) ?? (byNorm.get(key) ? [byNorm.get(key)!.id] : null);
          for (let m = 0; m < 12; m++) {
            const amount = num(r[2 + m]);
            if (amount <= 0) continue;
            const month = `${year}-${pad(m + 1)}-01`;
            if (!ids || ids.length === 0) {
              unmatched.add(name);
              payments.push({ client_id: null, label: name, amount: Math.round(amount * 100) / 100, month });
            } else {
              // vários clientes no mesmo nome (ex.: Skincorpus): divide pelo valor do contrato
              const total = ids.reduce((s, id) => s + contractOf(id), 0);
              ids.forEach((id) => {
                const share = total > 0 ? contractOf(id) / total : 1 / ids.length;
                payments.push({ client_id: id, label: null, amount: Math.round(amount * share * 100) / 100, month, notes: ids.length > 1 ? `Planilha: ${name}` : null });
              });
            }
          }
        }
      } else if (mCost) {
        let section = "";
        for (const r of rows.slice(1)) {
          const a = typeof r[0] === "string" ? r[0].trim() : "";
          const name = typeof r[1] === "string" ? r[1].trim() : "";
          if (!name) {
            if (a && !/^previs/i.test(a)) section = a; // cabeçalho de seção
            continue;
          }
          if (STOP_COST.test(name)) break;
          if (/^total/i.test(name)) continue;
          for (let m = 0; m < 12; m++) {
            const amount = num(r[2 + m]);
            if (amount <= 0) continue;
            costs.push({ name, section, category: categoryOf(section, name), amount: Math.round(amount * 100) / 100, month: `${year}-${pad(m + 1)}-01` });
          }
        }
      }
    }

    if (!years.length) return await fail("Não achei as abas \"Receitas {ano}\" / \"Despesas {ano}\" na planilha");
    const { data, error } = await supabase.rpc("finance_apply_sheet", { p: { years, payments, costs, unmatched: [...unmatched].sort() } });
    if (error) return await fail("Erro ao gravar: " + error.message);
    // a resposta só traz contagens (os nomes ficam em finance_sync_runs, que só a equipe lê)
    return new Response(JSON.stringify({ ok: true, years, ...data, sem_cadastro: unmatched.size }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return await fail(String((e as Error)?.message ?? e));
  }
});
