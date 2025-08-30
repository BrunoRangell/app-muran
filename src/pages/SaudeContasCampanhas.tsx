import React, { useState } from "react";
import AccountCard, { AccountData } from "@/components/account-health/AccountCard";
import "./SaudeContasCampanhas.css";

interface ClientData {
  cliente: string;
  meta?: AccountData | null;
  google?: AccountData | null;
}

const sampleData: ClientData[] = [
  {
    cliente: 'Megha Imóveis',
    meta: {
      id: 'act_192612319156232',
      status: { code: 1, label: 'Ativa', tone: 'ok' },
      billing_model: 'pos',
      saldo: { type: 'numeric', value: 91.81, source: 'operational', percent: 0.22 },
      ultima_recarga: { date: '2025-08-01', amount: 900.00 },
      badges: []
    },
    google: {
      id: '123-456-7890',
      status: { code: 'ENABLED', label: 'Ativa', tone: 'ok' },
      billing_model: 'pos',
      saldo: { type: 'credit_card' },
      ultima_recarga: null,
      badges: []
    }
  },
  {
    cliente: 'Simmons Colchões',
    meta: {
      id: 'act_5616617858447105',
      status: { code: 1, label: 'Ativa', tone: 'ok' },
      billing_model: 'pre',
      saldo: { type: 'numeric', value: 310.29, source: 'display_string', percent: 0.68 },
      ultima_recarga: { date: '2025-08-18', amount: 500.00 },
      badges: []
    },
    google: {
      id: '234-567-8901',
      status: { code: 'ENABLED', label: 'Ativa', tone: 'ok' },
      billing_model: 'pos',
      saldo: { type: 'credit_card' },
      ultima_recarga: null,
      badges: []
    }
  },
  {
    cliente: 'Elegance Móveis',
    meta: {
      id: 'act_23846346246380483',
      status: { code: 2, label: 'Inativa', tone: 'crit' },
      billing_model: 'pos',
      saldo: { type: 'numeric', value: -23.27, source: 'operational', percent: 0 },
      ultima_recarga: { date: '2025-07-28', amount: 300.00 },
      badges: ['erro_pagamento']
    },
    google: {
      id: null,
      status: { code: 'NONE', label: 'Não conectado', tone: 'info' },
      billing_model: 'pos',
      saldo: { type: 'unavailable' },
      ultima_recarga: null,
      badges: []
    }
  },
  {
    cliente: 'Astra Design',
    meta: {
      id: 'act_1111111111111',
      status: { code: 1, label: 'Ativa', tone: 'ok' },
      billing_model: 'pre',
      saldo: { type: 'numeric', value: 154.10, source: 'display_string', percent: 0.45 },
      ultima_recarga: { date: '2025-08-20', amount: 200.00 },
      badges: []
    },
    google: {
      id: '999-222-3333',
      status: { code: 'ENABLED', label: 'Ativa', tone: 'ok' },
      billing_model: 'pos',
      saldo: { type: 'numeric', value: 75.00, source: 'budget_remaining', percent: 0.3 },
      ultima_recarga: null,
      badges: []
    }
  }
];

const SaudeContasCampanhas: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'contas' | 'campanhas'>('contas');
  const [search, setSearch] = useState('');
  const [clients, setClients] = useState<ClientData[]>(sampleData);

  const handleSort = () => {
    const sorted = [...clients].sort((a, b) => {
      const aVals = [a.meta?.saldo, a.google?.saldo]
        .filter((s): s is AccountData['saldo'] => !!s && s.type === 'numeric')
        .map(s => s!.value || 0);
      const bVals = [b.meta?.saldo, b.google?.saldo]
        .filter((s): s is AccountData['saldo'] => !!s && s.type === 'numeric')
        .map(s => s!.value || 0);
      const aMin = aVals.length ? Math.min(...aVals) : Number.POSITIVE_INFINITY;
      const bMin = bVals.length ? Math.min(...bVals) : Number.POSITIVE_INFINITY;
      return aMin - bMin;
    });
    setClients(sorted);
  };

  const filtered = clients.filter(c => c.cliente.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="health-page">
      <div className="container">
        <header>
          <div>
            <div className="title">Saúde – Visão de Contas & Campanhas</div>
            <div className="muted">Wireframe com cards padronizados (Meta | Google por cliente)</div>
          </div>
          <button className="btn icon" onClick={() => { /* placeholder */ }}>⟳ Atualizar</button>
        </header>

        <div className="tabs">
          <button className={`tab ${activeTab === 'contas' ? 'active' : ''}`} onClick={() => setActiveTab('contas')}>Visão de Contas</button>
          <button className={`tab ${activeTab === 'campanhas' ? 'active' : ''}`} onClick={() => setActiveTab('campanhas')}>Visão de Campanhas</button>
        </div>

        {activeTab === 'contas' ? (
          <>
            <div className="toolbar">
              <input className="grow" type="text" placeholder="Buscar cliente…" value={search} onChange={e => setSearch(e.target.value)} />
              <select><option value="">Tipo (todos)</option><option value="pre">Pré‑paga</option><option value="pos">Pós‑paga</option></select>
              <select><option value="">Urgência (todas)</option><option value="crit">Crítico</option><option value="warn">Alto</option><option value="ok">OK</option></select>
              <button className="btn sm" onClick={handleSort}>Ordenar por menor saldo</button>
            </div>

            <section className="clients">
              {filtered.map(client => (
                <React.Fragment key={client.cliente}>
                  <div className="muted" style={{ margin: '6px 2px 2px' }}>Cliente: <strong>{client.cliente}</strong></div>
                  <div className="row">
                    {client.meta ? <AccountCard platform="meta" account={client.meta} /> : <article className="card empty"><div>Meta · sem conta conectada</div></article>}
                    {client.google ? <AccountCard platform="google" account={client.google} /> : <article className="card empty"><div>Google · sem conta conectada</div></article>}
                  </div>
                </React.Fragment>
              ))}
            </section>
          </>
        ) : (
          <div className="muted" style={{ marginTop: '20px' }}>Visão de Campanhas em desenvolvimento…</div>
        )}
      </div>
    </div>
  );
};

export default SaudeContasCampanhas;
