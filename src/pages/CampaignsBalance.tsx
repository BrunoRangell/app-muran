import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AccountData {
  id: string | null;
  status: { code: number | string; label: string; tone: "ok" | "warn" | "crit" | "info" };
  billing_model: "pre" | "pos";
  saldo: {
    type: "numeric" | "credit_card" | "unavailable";
    value?: number;
    source?: string;
    percent?: number;
  };
  ultima_recarga: { date: string; amount: number } | null;
  badges: string[];
}

interface ClientData {
  cliente: string;
  meta?: AccountData;
  google?: AccountData;
}

function pctToClass(p: number) {
  if (p <= 0.25) return "crit";
  if (p <= 0.5) return "warn";
  return "ok";
}

function money(v?: number) {
  return (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function extractBalanceFromDisplayString(display?: string): number | null {
  if (!display) return null;
  const match = display.match(/Saldo disponível \(R\$([\d\.\,]+) BRL\)/i);
  if (!match) return null;
  const value = parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
  return isNaN(value) ? null : value;
}

function mapStatus(accountStatus: number, disableReason: number) {
  const statusMap: Record<number, string> = {
    1: "Ativa",
    2: "Desativada",
    3: "Não ativa",
    7: "Em análise",
    8: "Restrita temporariamente",
    9: "Pendente de verificação de identidade",
    101: "Encerrada / fechada"
  };
  const label = statusMap[accountStatus] || "—";
  const tone = accountStatus === 1 ? "ok" : "crit";
  const badges: string[] = [];
  if (disableReason === 1) badges.push("erro_pagamento");
  return { status: { code: accountStatus, label, tone }, badges };
}

async function fetchFundingEvents(accountId: string, since: string): Promise<number> {
  const { data, error } = await supabase.functions.invoke("meta-account-events", {
    body: { accountId, since }
  });
  if (error) {
    console.error("Erro ao buscar eventos de recarga:", error);
    return 0;
  }
  const events = (data?.data || []) as any[];
  const types = new Set([
    "funding_event_successful",
    "ad_account_manual_payment",
    "ad_account_add_funds",
    "funds_added"
  ]);
  let total = 0;
  for (const ev of events) {
    if (types.has(ev.event_type) || ev.translated_event_type === "Quantia adicionada ao saldo") {
      try {
        const extra = JSON.parse(ev.extra_data || '{}');
        total += Number(extra.amount || 0);
      } catch {}
    }
  }
  return total;
}

async function fetchSpend(accountId: string, since: string): Promise<number> {
  const { data, error } = await supabase.functions.invoke("meta-account-spend", {
    body: { accountId, since }
  });
  if (error) {
    console.error("Erro ao buscar gasto:", error);
    return 0;
  }
  const rows = (data?.data || []) as any[];
  const spend = rows.reduce((sum, r) => sum + parseFloat(r.spend || "0"), 0);
  return Math.round(spend * 100);
}

async function fetchMetaAccount(accountId: string): Promise<AccountData> {
  const cleanId = accountId.replace("act_", "");
  const { data, error } = await supabase.functions.invoke("meta-account-balance", {
    body: { accountId: cleanId }
  });
  if (error) {
    console.error("Erro ao buscar dados da conta:", error);
    throw error;
  }
  const { status, badges } = mapStatus(data.account_status, data.disable_reason);
  const billing_model: "pre" | "pos" = data.is_prepay_account ? "pre" : "pos";
  let saldo: AccountData["saldo"] = { type: "credit_card" };
  if (data.is_prepay_account) {
    let value = extractBalanceFromDisplayString(data.expired_funding_source_details?.display_string);
    let source = "display_string";
    if (value === null) {
      const spendCap = Number(data.spend_cap);
      const amountSpent = Number(data.amount_spent);
      if (spendCap > 0) {
        value = (spendCap - amountSpent) / 100;
        source = "spendcap_minus_spent";
      }
    }
    if (value === null) {
      saldo = { type: "unavailable" };
    } else {
      const spendCap = Number(data.spend_cap);
      const percent = spendCap > 0 ? (spendCap - Number(data.amount_spent)) / spendCap : undefined;
      saldo = { type: "numeric", value, source, percent };
    }
  } else {
    const { data: manual } = await supabase
      .from('manual_balances' as any)
      .select('balance_cents, defined_at')
      .eq('account_id', cleanId)
      .order('defined_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (manual) {
      const since = manual.defined_at.substring(0, 10);
      const recargas = await fetchFundingEvents(cleanId, since);
      const spent = await fetchSpend(cleanId, since);
      const balanceCents = manual.balance_cents + recargas - spent;
      saldo = { type: "numeric", value: balanceCents / 100, source: "operational" };
    } else {
      saldo = { type: "credit_card" };
    }
  }
  return { id: `act_${cleanId}`, status, billing_model, saldo, ultima_recarga: null, badges };
}

interface AccountCardProps {
  platform: "meta" | "google";
  data?: AccountData;
  onDefineSaldo?: () => void;
}

const AccountCard = ({ platform, data, onDefineSaldo }: AccountCardProps) => {
  if (!data) {
    return (
      <article className="border border-gray-200 rounded-lg p-4 text-center text-gray-500 h-full flex items-center justify-center">
        {platform === "meta" ? "Meta" : "Google"} · sem conta conectada
      </article>
    );
  }

  const isMeta = platform === "meta";
  const plabel = isMeta ? "Meta Ads" : "Google Ads";
  const logoClass = isMeta ? "bg-[#4267B2]" : "bg-[#34A853]";

  const tone = data.status?.tone || "info";
  const billingTone = data.billing_model === "pre" ? "ok" : "info";

  let saldoValue = "";
  let batteryClass = "ok";
  let batteryPercent = Math.max(0, Math.min(1, data.saldo?.percent ?? 0));
  if (data.saldo?.type === "numeric") {
    saldoValue = money(data.saldo.value);
    batteryClass = pctToClass(batteryPercent);
  } else if (data.saldo?.type === "credit_card") {
    saldoValue = "Cartão de crédito";
    batteryClass = "info";
    batteryPercent = 0;
  } else {
    saldoValue = "Indisponível";
    batteryClass = "crit";
    batteryPercent = 0;
  }

  let fonte = "—";
  if (data.saldo?.type === "numeric") {
    const src = data.saldo.source || "—";
    const map: Record<string, string> = {
      display_string: "display_string",
      spendcap_minus_spent: "spend_cap − amount_spent",
      operational: "operacional (recargas − Insights)",
      budget_remaining: "orçamento restante"
    };
    fonte = map[src] || src;
  } else if (data.saldo?.type === "credit_card") {
    fonte = "pagamento automático";
  }

  const idText = data.id ? (isMeta ? data.id : `CID ${data.id}`) : "—";

  return (
    <article className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm grid gap-3">
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <span className={`w-5 h-5 rounded bg-black ${logoClass}`}></span>
          <div className="min-w-0">
            <h4 className="font-bold truncate max-w-[200px]">{plabel}</h4>
            <div className="text-xs text-gray-500">{idText}</div>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-1">
          <span className={`px-2 py-1 rounded-full text-xs font-bold border ${tone === "ok" ? "bg-green-50 text-green-700 border-green-200" : tone === "warn" ? "bg-yellow-50 text-yellow-700 border-yellow-200" : tone === "crit" ? "bg-red-50 text-red-700 border-red-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}>{data.status?.label || "—"}</span>
          <span className={`px-2 py-1 rounded-full text-xs font-bold border ${billingTone === "ok" ? "bg-green-50 text-green-700 border-green-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}>{data.billing_model === "pre" ? "Pré‑paga" : "Pós‑paga"}</span>
          {data.badges.includes("erro_pagamento") && (
            <span className="px-2 py-1 rounded-full text-xs font-bold border bg-red-50 text-red-700 border-red-200">Erro de pagamento</span>
          )}
        </div>
      </header>

      <div className="grid grid-cols-[1fr_auto] items-center gap-2">
        <div className="text-xs text-gray-500">Saldo restante</div>
        <div className={`text-xl font-black ${data.saldo?.type === "numeric" ? "text-gray-900" : "text-gray-500 font-bold"}`}>{saldoValue}</div>
        <div className={`col-span-2 h-2 rounded-full border overflow-hidden ${batteryClass === "ok" ? "border-green-200 bg-green-50" : batteryClass === "warn" ? "border-yellow-200 bg-yellow-50" : batteryClass === "crit" ? "border-red-200 bg-red-50" : "border-blue-200 bg-blue-50"}`}>
          <span className={`block h-full ${batteryClass === "ok" ? "bg-green-500" : batteryClass === "warn" ? "bg-yellow-400" : batteryClass === "crit" ? "bg-red-400" : "bg-blue-400"}`} style={{ width: `${batteryPercent * 100}%` }}></span>
        </div>
        <div className="col-span-2 text-xs text-gray-500">Fonte: {fonte}</div>
      </div>

      <div className="flex items-center gap-1 text-xs text-gray-500">
        <span className="font-semibold text-gray-700">Última recarga:</span> <span>—</span>
      </div>

      <div className="flex justify-end gap-2">
        {data.billing_model === "pos" && onDefineSaldo && (
          <button className="bg-[#ff7a00] text-white rounded-md px-3 py-1 text-sm font-bold" onClick={onDefineSaldo}>
            Definir saldo atual da conta
          </button>
        )}
        <button className="border border-gray-200 rounded-md px-3 py-1 text-sm">Histórico</button>
        <button className="border border-gray-200 rounded-md px-3 py-1 text-sm">Abrir no {isMeta ? "Gerenciador" : "Ads"}</button>
      </div>
    </article>
  );
};

export default function CampaignsBalance() {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [query, setQuery] = useState("");

  const loadClients = async () => {
    const { data: accounts } = await supabase
      .from('client_accounts')
      .select('client_id, account_id, platform, clients(company_name)')
      .eq('status', 'active');

    const map = new Map<string, ClientData>();
    accounts?.forEach(acc => {
      const name = acc.clients?.company_name || '—';
      const client = map.get(acc.client_id) || { cliente: name };
      if (acc.platform === 'meta') {
        client.meta = {
          id: acc.account_id,
          status: { code: 0, label: '', tone: 'info' },
          billing_model: 'pos',
          saldo: { type: 'credit_card' },
          ultima_recarga: null,
          badges: []
        };
      } else if (acc.platform === 'google') {
        client.google = {
          id: acc.account_id,
          status: { code: 'ENABLED', label: 'Ativa', tone: 'ok' },
          billing_model: 'pos',
          saldo: { type: 'credit_card' },
          ultima_recarga: null,
          badges: []
        };
      }
      map.set(acc.client_id, client);
    });

    const list = Array.from(map.values());
    await Promise.all(list.map(async client => {
      if (client.meta?.id) {
        client.meta = await fetchMetaAccount(client.meta.id);
      }
    }));
    setClients(list);
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleSort = () => {
    const sorted = [...clients].sort((a, b) => {
      const aVals = [a.meta?.saldo, a.google?.saldo].filter(s => s && s.type === "numeric").map(s => s!.value!);
      const bVals = [b.meta?.saldo, b.google?.saldo].filter(s => s && s.type === "numeric").map(s => s!.value!);
      const aMin = aVals.length ? Math.min(...aVals) : Number.POSITIVE_INFINITY;
      const bMin = bVals.length ? Math.min(...bVals) : Number.POSITIVE_INFINITY;
      return aMin - bMin;
    });
    setClients(sorted);
  };

  const handleDefineSaldo = async (accountId: string | null) => {
    if (!accountId) return;
    const input = window.prompt('Informe o saldo disponível agora (R$)');
    if (!input) return;
    const value = parseFloat(input.replace(',', '.'));
    if (isNaN(value)) {
      alert('Valor inválido');
      return;
    }
    const cents = Math.round(value * 100);
    const cleanId = accountId.replace('act_', '');
    await supabase
      .from('manual_balances' as any)
      .upsert({ account_id: cleanId, balance_cents: cents, defined_at: new Date().toISOString() });
    await loadClients();
  };

  const filtered = clients.filter(c => c.cliente.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#f4f6fb] text-[#1f2937]">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <header className="flex items-end justify-between mb-4">
          <div>
            <div className="font-extrabold text-xl">Saúde das Contas</div>
            <div className="text-xs text-gray-500">Wireframe com cards padronizados (Meta | Google por cliente)</div>
          </div>
          <button className="bg-[#ff7a00] text-white rounded-md px-3 py-2 font-bold flex items-center gap-2" onClick={loadClients}>⟳ Atualizar</button>
        </header>

        <div className="flex flex-wrap gap-2 bg-white border border-gray-200 rounded-xl p-3 shadow mb-4">
          <input
            className="flex-1 min-w-[260px] border border-gray-200 rounded-md px-3 py-2"
            type="text"
            placeholder="Buscar cliente…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <select className="border border-gray-200 rounded-md px-3 py-2">
            <option value="">Tipo (todos)</option>
            <option value="pre">Pré‑paga</option>
            <option value="pos">Pós‑paga</option>
          </select>
          <select className="border border-gray-200 rounded-md px-3 py-2">
            <option value="">Urgência (todas)</option>
            <option value="crit">Crítico</option>
            <option value="warn">Alto</option>
            <option value="ok">OK</option>
          </select>
          <button
            className="bg-[#ff7a00] text-white rounded-md px-3 py-2 text-sm font-bold"
            onClick={handleSort}
          >
            Ordenar por menor saldo
          </button>
        </div>

        <section className="space-y-4">
          {filtered.map(client => (
            <div key={client.cliente} className="space-y-2">
              <div className="text-xs text-gray-500">
                Cliente: <strong>{client.cliente}</strong>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <AccountCard
                  platform="meta"
                  data={client.meta}
                  onDefineSaldo={client.meta ? () => handleDefineSaldo(client.meta!.id) : undefined}
                />
                <AccountCard platform="google" data={client.google} />
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

