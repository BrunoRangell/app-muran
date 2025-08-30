import { useEffect, useState } from "react";
import { useMetaBalance, ApiClient, ApiAccount } from "@/hooks/useMetaBalance";

interface AccountInfo {
  id: string | null;
  status?: { code: any; label: string; tone: "ok" | "warn" | "crit" | "info" };
  billing_model?: "pre" | "pos";
  saldo?: {
    type: "numeric" | "credit_card" | "unavailable";
    value?: number;
    source?: string;
    percent?: number;
  } | null;
  ultima_recarga?: { date: string; amount: number } | null;
  badges?: string[];
}

interface ClientData {
  cliente: string;
  meta?: AccountInfo;
  google?: AccountInfo;
}

function mapAccount(api: ApiAccount): AccountInfo {
  return {
    id: api.id,
    status: {
      code: api.status_code,
      label: api.status_label,
      tone: api.status_tone,
    },
    billing_model: api.billing_model,
    saldo:
      api.balance_type === "numeric"
        ? {
            type: "numeric",
            value: api.balance_value,
            source: api.balance_source,
            percent: api.balance_percent,
          }
        : { type: api.balance_type },
    ultima_recarga:
      api.last_recharge_date && api.last_recharge_amount !== undefined
        ? { date: api.last_recharge_date, amount: api.last_recharge_amount }
        : null,
    badges: api.badges || [],
  };
}

function mapClient(api: ApiClient): ClientData {
  return {
    cliente: api.client,
    meta: api.meta ? mapAccount(api.meta) : undefined,
    google: api.google ? mapAccount(api.google) : undefined,
  };
}

function pctToClass(p: number) {
  if (p <= 0.25) return "crit";
  if (p <= 0.5) return "warn";
  return "ok";
}

function money(v?: number) {
  return (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface CardProps {
  platform: "meta" | "google";
  obj: AccountInfo;
}

const toneStyles: Record<string, string> = {
  ok: "bg-green-100 text-green-800 border-green-200",
  warn: "bg-yellow-100 text-yellow-800 border-yellow-200",
  crit: "bg-red-100 text-red-800 border-red-200",
  info: "bg-blue-100 text-blue-800 border-blue-200",
};

function Card({ platform, obj }: CardProps) {
  const isMeta = platform === "meta";
  const plabel = isMeta ? "Meta Ads" : "Google Ads";
  const logoClass = isMeta ? "bg-[#4267B2]" : "bg-[#34A853]";

  const tone = obj.status?.tone || "info";
  const statusChip = (
    <span className={`px-2 py-1 rounded-full text-xs font-bold border ${toneStyles[tone]}`}>{obj.status?.label || "—"}</span>
  );
  const billingTone = obj.billing_model === "pre" ? "ok" : "info";
  const billingChip = (
    <span className={`px-2 py-1 rounded-full text-xs font-bold border ${toneStyles[billingTone]}`}>
      {obj.billing_model === "pre" ? "Pré-paga" : "Pós-paga"}
    </span>
  );

  let saldoValue: JSX.Element = <div className="value" />;
  let batteryClass = "ok";
  let batteryPercent = Math.max(0, Math.min(1, obj.saldo?.percent ?? 0));

  if (obj.saldo?.type === "numeric") {
    saldoValue = <div className="text-2xl font-extrabold">{money(obj.saldo.value)}</div>;
    batteryClass = pctToClass(batteryPercent);
  } else if (obj.saldo?.type === "credit_card") {
    saldoValue = <div className="text-2xl font-bold text-gray-500">Cartão de crédito</div>;
    batteryClass = "info";
    batteryPercent = 0;
  } else {
    saldoValue = <div className="text-2xl font-bold text-gray-500">Indisponível</div>;
    batteryClass = "crit";
    batteryPercent = 0;
  }

  let fonte = "—";
  if (obj.saldo?.type === "numeric") {
    const src = obj.saldo?.source || "—";
    const map: Record<string, string> = {
      display_string: "display_string",
      spendcap_minus_spent: "spend_cap − amount_spent",
      operational: "operacional (recargas − Insights)",
      budget_remaining: "orçamento restante",
    };
    fonte = map[src] || src;
  } else if (obj.saldo?.type === "credit_card") {
    fonte = "pagamento automático";
  }

  let lastHtml: JSX.Element = (
    <>
      <span className="font-semibold text-gray-600">Última recarga:</span> <span>—</span>
    </>
  );
  if (obj.saldo?.type === "numeric" && obj.ultima_recarga) {
    const d = new Date(obj.ultima_recarga.date + "T00:00:00");
    const date = d.toLocaleDateString("pt-BR");
    lastHtml = (
      <>
        <span className="font-semibold text-gray-600">Última recarga:</span> <span>{date}</span>
        <span>— {money(obj.ultima_recarga.amount)}</span>
      </>
    );
  }

  const idText = obj.id ? (isMeta ? obj.id : "CID " + obj.id) : "—";

  return (
    <article className="bg-white border border-gray-200 rounded-xl p-4 shadow flex flex-col gap-4 min-h-[200px]">
      <header className="flex justify-between items-center gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <span className={`w-6 h-6 rounded ${logoClass}`} />
          <div>
            <h4 className="font-extrabold truncate max-w-[200px]">{plabel}</h4>
            <div className="text-xs text-gray-500">{idText}</div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {statusChip}
          {billingChip}
        </div>
      </header>

      <div className="grid grid-cols-[1fr_auto] items-center gap-2">
        <div className="text-xs text-gray-500">Saldo restante</div>
        {saldoValue}
        <div className="col-span-2 h-2 rounded-full bg-slate-100 border border-gray-200 overflow-hidden">
          <span
            className={`block h-full ${
              batteryClass === "ok"
                ? "bg-gradient-to-r from-green-500 to-green-300"
                : batteryClass === "warn"
                ? "bg-gradient-to-r from-yellow-500 to-yellow-300"
                : batteryClass === "crit"
                ? "bg-gradient-to-r from-red-500 to-red-300"
                : "bg-gradient-to-r from-blue-500 to-blue-300"
            }`}
            style={{ width: `${batteryPercent * 100}%` }}
          ></span>
        </div>
        <div className="col-span-2 text-xs text-gray-500">Fonte: {fonte}</div>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500">{lastHtml}</div>

      <div className="flex gap-2 justify-end mt-auto">
        {obj.billing_model === "pos" && obj.saldo?.type !== "numeric" && (
          <button className="px-3 py-1 rounded-md text-sm bg-[#ff7a00] text-white">Definir saldo atual</button>
        )}
        <button className="px-3 py-1 rounded-md text-sm border border-gray-200">Histórico</button>
        <button className="px-3 py-1 rounded-md text-sm border border-gray-200">
          Abrir no {isMeta ? "Gerenciador" : "Ads"}
        </button>
      </div>
    </article>
  );
}

export default function SaldoCampanhas() {
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<ClientData[]>([]);
  const { data: apiClients } = useMetaBalance();

  useEffect(() => {
    if (apiClients) {
      setClients(apiClients.map(mapClient));
    }
  }, [apiClients]);

  const handleSort = () => {
    setClients(prev => {
      const sorted = [...prev].sort((a, b) => {
        const aVals = [a.meta?.saldo, a.google?.saldo]
          .filter(s => s && s.type === "numeric")
          .map(s => s!.value as number);
        const bVals = [b.meta?.saldo, b.google?.saldo]
          .filter(s => s && s.type === "numeric")
          .map(s => s!.value as number);
        const aMin = aVals.length ? Math.min(...aVals) : Number.POSITIVE_INFINITY;
        const bMin = bVals.length ? Math.min(...bVals) : Number.POSITIVE_INFINITY;
        return aMin - bMin;
      });
      return sorted;
    });
  };

  const filtered = clients.filter(client =>
    client.cliente.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f4f6fb] text-[#1f2937]">
      <div className="max-w-[1220px] mx-auto p-6">
        <header className="flex items-end justify-between mb-4">
          <div>
            <h1 className="font-extrabold text-xl">Saúde das Contas</h1>
            <div className="text-xs text-gray-500">
              Wireframe com cards padronizados (Meta | Google por cliente)
            </div>
          </div>
          <button className="bg-[#ff7a00] text-white rounded-lg px-3 py-2 font-bold">
            ⟳ Atualizar
          </button>
        </header>

        <div className="flex flex-wrap gap-2 bg-white p-3 rounded-xl border border-gray-200 shadow mb-4">
          <input
            className="flex-1 min-w-[260px] border border-gray-200 rounded-lg px-3 py-2"
            placeholder="Buscar cliente…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="border border-gray-200 rounded-lg px-3 py-2">
            <option value="">Tipo (todos)</option>
            <option value="pre">Pré-paga</option>
            <option value="pos">Pós-paga</option>
          </select>
          <select className="border border-gray-200 rounded-lg px-3 py-2">
            <option value="">Urgência (todas)</option>
            <option value="crit">Crítico</option>
            <option value="warn">Alto</option>
            <option value="ok">OK</option>
          </select>
          <button
            onClick={handleSort}
            className="bg-[#ff7a00] text-white rounded-lg px-3 py-2 text-sm font-bold"
          >
            Ordenar por menor saldo
          </button>
        </div>

        <section className="space-y-4">
          {filtered.map(client => (
            <div key={client.cliente}>
              <div className="text-sm text-gray-500 mb-1">
                Cliente: <strong>{client.cliente}</strong>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {client.meta ? (
                  <Card platform="meta" obj={client.meta} />
                ) : (
                  <article className="border border-dashed border-gray-300 rounded-xl p-4 grid place-items-center min-h-[200px] opacity-75">
                    Meta · sem conta conectada
                  </article>
                )}
                {client.google ? (
                  <Card platform="google" obj={client.google} />
                ) : (
                  <article className="border border-dashed border-gray-300 rounded-xl p-4 grid place-items-center min-h-[200px] opacity-75">
                    Google · sem conta conectada
                  </article>
                )}
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
