import { useState } from "react";

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

const initialData: ClientData[] = [
  {
    cliente: "Megha Imóveis",
    meta: {
      id: "act_192612319156232",
      status: { code: 1, label: "Ativa", tone: "ok" },
      billing_model: "pos",
      saldo: { type: "numeric", value: 91.81, source: "operational", percent: 0.22 },
      ultima_recarga: { date: "2025-08-01", amount: 900.0 },
      badges: []
    },
    google: {
      id: "123-456-7890",
      status: { code: "ENABLED", label: "Ativa", tone: "ok" },
      billing_model: "pos",
      saldo: { type: "credit_card" },
      ultima_recarga: null,
      badges: []
    }
  },
  {
    cliente: "Simmons Colchões",
    meta: {
      id: "act_5616617858447105",
      status: { code: 1, label: "Ativa", tone: "ok" },
      billing_model: "pre",
      saldo: { type: "numeric", value: 310.29, source: "display_string", percent: 0.68 },
      ultima_recarga: { date: "2025-08-18", amount: 500.0 },
      badges: []
    },
    google: {
      id: "234-567-8901",
      status: { code: "ENABLED", label: "Ativa", tone: "ok" },
      billing_model: "pos",
      saldo: { type: "credit_card" },
      ultima_recarga: null,
      badges: []
    }
  },
  {
    cliente: "Elegance Móveis",
    meta: {
      id: "act_23846346246380483",
      status: { code: 2, label: "Inativa", tone: "crit" },
      billing_model: "pos",
      saldo: { type: "numeric", value: -23.27, source: "operational", percent: 0 },
      ultima_recarga: { date: "2025-07-28", amount: 300.0 },
      badges: ["erro_pagamento"]
    },
    google: {
      id: null,
      status: { code: "NONE", label: "Não conectado", tone: "info" },
      billing_model: "pos",
      saldo: { type: "unavailable" },
      ultima_recarga: null,
      badges: []
    }
  },
  {
    cliente: "Astra Design",
    meta: {
      id: "act_1111111111111",
      status: { code: 1, label: "Ativa", tone: "ok" },
      billing_model: "pre",
      saldo: { type: "numeric", value: 154.1, source: "display_string", percent: 0.45 },
      ultima_recarga: { date: "2025-08-20", amount: 200.0 },
      badges: []
    },
    google: {
      id: "999-222-3333",
      status: { code: "ENABLED", label: "Ativa", tone: "ok" },
      billing_model: "pos",
      saldo: { type: "numeric", value: 75.0, source: "budget_remaining", percent: 0.3 },
      ultima_recarga: null,
      badges: []
    }
  }
];

function pctToClass(p: number) {
  if (p <= 0.25) return "crit";
  if (p <= 0.5) return "warn";
  return "ok";
}

function money(v?: number) {
  return (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface AccountCardProps {
  platform: "meta" | "google";
  data?: AccountData;
}

const AccountCard = ({ platform, data }: AccountCardProps) => {
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

  let lastContent: string;
  if (data.saldo?.type === "numeric" && data.ultima_recarga) {
    const d = new Date(data.ultima_recarga.date + "T00:00:00");
    lastContent = `${d.toLocaleDateString("pt-BR")} — ${money(data.ultima_recarga.amount)}`;
  } else {
    lastContent = "—";
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
        <span className="font-semibold text-gray-700">Última recarga:</span> <span>{lastContent}</span>
      </div>

      <div className="flex justify-end gap-2">
        {data.billing_model === "pos" && data.saldo?.type !== "numeric" && (
          <button className="bg-[#ff7a00] text-white rounded-md px-3 py-1 text-sm font-bold">Definir saldo atual</button>
        )}
        <button className="border border-gray-200 rounded-md px-3 py-1 text-sm">Histórico</button>
        <button className="border border-gray-200 rounded-md px-3 py-1 text-sm">Abrir no {isMeta ? "Gerenciador" : "Ads"}</button>
      </div>
    </article>
  );
};

export default function CampaignsBalance() {
  const [clients, setClients] = useState<ClientData[]>(initialData);
  const [query, setQuery] = useState("");

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

  const filtered = clients.filter(c => c.cliente.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#f4f6fb] text-[#1f2937]">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <header className="flex items-end justify-between mb-4">
          <div>
            <div className="font-extrabold text-xl">Saúde das Contas</div>
            <div className="text-xs text-gray-500">Wireframe com cards padronizados (Meta | Google por cliente)</div>
          </div>
          <button className="bg-[#ff7a00] text-white rounded-md px-3 py-2 font-bold flex items-center gap-2">⟳ Atualizar</button>
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
                <AccountCard platform="meta" data={client.meta} />
                <AccountCard platform="google" data={client.google} />
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

