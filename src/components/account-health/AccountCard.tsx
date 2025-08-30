import React from "react";

export interface AccountStatus {
  code: number | string;
  label: string;
  tone: "ok" | "warn" | "crit" | "info";
}

export interface AccountSaldo {
  type: "numeric" | "credit_card" | "unavailable";
  value?: number;
  source?: string;
  percent?: number;
}

export interface AccountRecarga {
  date: string;
  amount: number;
}

export interface AccountData {
  id: string | null;
  status?: AccountStatus;
  billing_model: "pre" | "pos";
  saldo?: AccountSaldo;
  ultima_recarga?: AccountRecarga | null;
  badges: string[];
}

interface AccountCardProps {
  platform: "meta" | "google";
  account: AccountData;
}

const pctToClass = (p: number) => {
  if (p <= 0.25) return "crit";
  if (p <= 0.5) return "warn";
  return "ok";
};

const money = (v: number | undefined) => {
  return (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

export const AccountCard: React.FC<AccountCardProps> = ({ platform, account }) => {
  const isMeta = platform === "meta";
  const plabel = isMeta ? "Meta Ads" : "Google Ads";
  const logoClass = isMeta ? "meta" : "google";

  const tone = account.status?.tone || "info";
  const statusChip = <span className={`chip ${tone}`}>{account.status?.label || "—"}</span>;
  const billingChip = (
    <span className={`chip ${account.billing_model === "pre" ? "ok" : "info"}`}>
      {account.billing_model === "pre" ? "Pré‑paga" : "Pós‑paga"}
    </span>
  );

  let saldoValue: React.ReactNode;
  let batteryClass = "ok";
  let batteryPercent = Math.max(0, Math.min(1, account.saldo?.percent ?? 0));

  if (account.saldo?.type === "numeric") {
    saldoValue = <div className="value">{money(account.saldo.value)}</div>;
    batteryClass = pctToClass(batteryPercent);
  } else if (account.saldo?.type === "credit_card") {
    saldoValue = <div className="value muted">Cartão de crédito</div>;
    batteryClass = "info";
    batteryPercent = 0;
  } else {
    saldoValue = <div className="value muted">Indisponível</div>;
    batteryClass = "crit";
    batteryPercent = 0;
  }

  let fonte = "—";
  if (account.saldo?.type === "numeric") {
    const src = account.saldo?.source || "—";
    const map: Record<string, string> = {
      display_string: "display_string",
      spendcap_minus_spent: "spend_cap − amount_spent",
      operational: "operacional (recargas − Insights)",
      budget_remaining: "orçamento restante",
    };
    fonte = map[src] || src;
  } else if (account.saldo?.type === "credit_card") {
    fonte = "pagamento automático";
  }

  let lastHtml: React.ReactNode = (
    <>
      <span className="label">Última recarga:</span> <span>—</span>
    </>
  );
  if (account.saldo?.type === "numeric" && account.ultima_recarga) {
    const d = new Date(account.ultima_recarga.date + "T00:00:00");
    const date = d.toLocaleDateString("pt-BR");
    lastHtml = (
      <>
        <span className="label">Última recarga:</span> <span>{date}</span>
        <span>— {money(account.ultima_recarga.amount)}</span>
      </>
    );
  }

  const idText = account.id ? (isMeta ? account.id : `CID ${account.id}`) : "—";

  return (
    <article className={`card card-account ${platform}`}>
      <header className="head">
        <div className="left">
          <span className={`logo ${logoClass}`}></span>
          <div>
            <h4 className="name">{plabel}</h4>
            <div className="accid">{idText}</div>
          </div>
        </div>
        <div className="chips">
          {statusChip}
          {billingChip}
        </div>
      </header>

      <div className="saldo">
        <div className="label">Saldo restante</div>
        {saldoValue}
        <div className={`battery ${batteryClass}`} title="Indicador de nível de saldo">
          <span style={{ width: `${batteryPercent * 100}%` }}></span>
        </div>
        <div className="hint">Fonte: {fonte}</div>
      </div>

      <div className="last">{lastHtml}</div>

      <div className="actions">
        {account.billing_model === "pos" && account.saldo?.type !== "numeric" && (
          <button className="btn sm">Definir saldo atual</button>
        )}
        <button className="btn ghost sm">Histórico</button>
        <button className="btn ghost sm">Abrir no {isMeta ? "Gerenciador" : "Ads"}</button>
      </div>
    </article>
  );
};

export default AccountCard;
