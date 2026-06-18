import { useMemo, useState, useEffect } from "react";
import {
  Eye, MousePointer, Target, TrendingUp, DollarSign,
  Facebook, Search, BarChart3, Filter,
  Repeat, Layers, Award,
  Users as UsersIcon, MapPin, PieChart as PieIcon,
} from "lucide-react";
import {
  Area, BarChart, Bar, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, ComposedChart,
} from "recharts";
import { SidebarNav } from "./premium-templates/dashcortex/SidebarNav";
import { KpiCard } from "./premium-templates/dashcortex/KpiCard";
import { PlatformBlock } from "./premium-templates/dashcortex/PlatformBlock";
import { TopCreativesSection } from "./TopCreativesSection";
import { CampaignsInsightsTable } from "./CampaignsInsightsTable";

interface MasterTrafficReportProps {
  data: any;
  platform: 'meta' | 'google' | 'both';
  viewMode?: 'combined' | 'meta' | 'google';
  clientName?: string;
  dateRange?: { start: string; end: string };
  accountId?: string;
  /** Quando true, não renderiza o background/shell próprio — o container pai já provê. */
  embedded?: boolean;
  /** Comparação com mês anterior no gráfico Performance ao longo do tempo */
  compareLastMonth?: boolean;
  onToggleCompareLastMonth?: (value: boolean) => void;
  previousData?: any;
  isLoadingPrevious?: boolean;
}

const fmtNum = (v: number) => new Intl.NumberFormat("pt-BR").format(Math.round(v || 0));
const fmtCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const fmtPct = (v: number) => `${(v || 0).toFixed(2)}%`;
const fmtDecimal = (v: number, d = 2) => (v || 0).toFixed(d);

// Cores Muran + plataformas
const C = {
  primary: "#ff6e00",
  meta: "#1877f2",
  google: "#34a853",
  blue: "#3b82f6",
  green: "#10b981",
  amber: "#f59e0b",
  purple: "#a855f7",
  pink: "#ec4899",
  red: "#ef4444",
};

const SECTION_ID = (id: string) => `dashcortex-section-${id}`;

function GlassCard({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <div
      id={id}
      className={`rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5 ${className}`}
    >
      {children}
    </div>
  );
}

function SectionTitle({ icon: Icon, label, hint }: { icon: any; label: string; hint?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-[#ff6e00]/10 border border-[#ff6e00]/20 flex items-center justify-center">
          <Icon className="h-4 w-4 text-[#ff6e00]" />
        </div>
        <h2 className="text-base font-semibold text-white tracking-tight">{label}</h2>
      </div>
      {hint && <span className="text-[11px] text-white/30 uppercase tracking-wider">{hint}</span>}
    </div>
  );
}

export function MasterTrafficReport({ data, platform, clientName, dateRange, embedded = false }: MasterTrafficReportProps) {
  const [activeSection, setActiveSection] = useState<string>("overview");

  useEffect(() => {
    const ids = ["overview", "performance", "meta-ads", "google-ads", "funnel", "audience", "creatives", "campaigns"];
    const elements = ids
      .map((id) => document.getElementById(`dashcortex-section-${id}`))
      .filter((el): el is HTMLElement => !!el);
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          const id = visible[0].target.id.replace("dashcortex-section-", "");
          setActiveSection(id);
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [data]);

  const normalized = useMemo(() => {
    if (!data) return null;

    const overview = data.overview || {};
    const metaData = data.metaData;
    const googleData = data.googleData;
    const isMeta = data.platform === "meta";
    const isGoogle = data.platform === "google";

    // Time series — usa o do platform-specific quando aplicável
    const buildSeries = (raw: any[]) =>
      (raw || []).slice(-30).map((p: any) => ({
        date: new Date(p.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        spend: p.spend || 0,
        clicks: p.clicks || 0,
        conversions: p.conversions || 0,
        impressions: p.impressions || 0,
      }));

    const metaSeries = buildSeries(metaData?.timeSeries || (isMeta ? data.timeSeries : []));
    const googleSeries = buildSeries(googleData?.timeSeries || (isGoogle ? data.timeSeries : []));
    const combinedSeries = buildSeries(data.timeSeries || []);

    // Demographics
    const demographics = metaData?.demographics || googleData?.demographics || data.demographics || {};
    const byAge = (demographics.byAge || []).filter((d: any) => d.label).slice(0, 8);
    const byGender = (demographics.byGender || []).filter((d: any) => d.label);
    const byLocation = (demographics.byLocation || demographics.locations || [])
      .map((r: any) => ({
        label: r.label || r.location || r.region || "—",
        value: r.conversions || r.clicks || 0,
        spend: r.spend || 0,
        clicks: r.clicks || 0,
        impressions: r.impressions || 0,
      }))
      .sort((a: any, b: any) => b.value - a.value);

    // Spend / impressions por plataforma
    const metaSpend = metaData?.overview?.spend?.current || (isMeta ? overview.spend?.current : 0) || 0;
    const googleSpend = googleData?.overview?.spend?.current || (isGoogle ? overview.spend?.current : 0) || 0;
    const metaImpr = metaData?.overview?.impressions?.current || (isMeta ? overview.impressions?.current : 0) || 0;
    const googleImpr = googleData?.overview?.impressions?.current || (isGoogle ? overview.impressions?.current : 0) || 0;

    const originData = [
      { name: "Meta Ads", value: metaImpr, color: C.meta },
      { name: "Google Ads", value: googleImpr, color: C.google },
    ].filter((d) => d.value > 0);

    // Top ads e campanhas
    const topAds = data.topAds || metaData?.topAds || googleData?.topAds || [];
    const campaigns = data.campaigns || [];

    return {
      overview,
      metaData,
      googleData,
      metaSeries,
      googleSeries,
      combinedSeries,
      byAge,
      byGender,
      byLocation,
      metaSpend,
      googleSpend,
      originData,
      topAds,
      campaigns,
    };
  }, [data, platform]);

  if (!normalized) return null;

  const {
    overview, metaData, googleData, metaSeries, googleSeries, combinedSeries,
    byAge, byGender, byLocation, metaSpend, googleSpend, originData,
    topAds, campaigns,
  } = normalized;

  const periodLabel = dateRange
    ? `${new Date(dateRange.start).toLocaleDateString("pt-BR")} — ${new Date(dateRange.end).toLocaleDateString("pt-BR")}`
    : "Período atual";

  // Mostrar comparativo cross-platform só quando platform=both e há dados dos dois lados
  const showCrossPlatform = platform === 'both' && metaSeries.length > 0 && googleSeries.length > 0;

  // Série combinada para chart (merge por data)
  const mergedSeries = useMemo(() => {
    if (!showCrossPlatform) return combinedSeries.length ? combinedSeries : (metaSeries.length ? metaSeries : googleSeries);
    const map = new Map<string, any>();
    metaSeries.forEach((p) => map.set(p.date, { date: p.date, meta: p.spend, google: 0, conversions: p.conversions }));
    googleSeries.forEach((p) => {
      const existing = map.get(p.date) || { date: p.date, meta: 0, google: 0, conversions: 0 };
      existing.google = p.spend;
      existing.conversions = (existing.conversions || 0) + p.conversions;
      map.set(p.date, existing);
    });
    return Array.from(map.values());
  }, [metaSeries, googleSeries, combinedSeries, showCrossPlatform]);

  const genderColors: Record<string, string> = {
    male: C.blue, masculino: C.blue, m: C.blue,
    female: C.pink, feminino: C.pink, f: C.pink,
    unknown: "#64748b", desconhecido: "#64748b",
  };

  const rootClass = embedded
    ? "dashcortex-root px-3 sm:px-6 lg:px-8 py-4 sm:py-6"
    : "dashcortex-root -mx-4 sm:-mx-6 lg:-mx-8 -mt-6 px-3 sm:px-6 lg:px-8 py-4 sm:py-6 min-h-screen";
  const rootStyle = embedded
    ? undefined
    : { background: "radial-gradient(ellipse at top, #1a1030 0%, #0B0F1A 50%)" };

  return (
    <div className={rootClass} style={rootStyle}>
      <style>{`
        .dashcortex-root { font-family: 'Space Grotesk', -apple-system, sans-serif; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .dashcortex-root [class*="recharts-"] text { fill: rgba(255,255,255,0.65); font-size: 11px; }
      `}</style>

      <div className="flex gap-6 max-w-[1600px] mx-auto">
        <SidebarNav active={activeSection} />

        <div className="flex-1 min-w-0 space-y-6">
          {/* ============ HEADER ============ */}
          <header
            id={SECTION_ID('overview')}
            className="flex flex-wrap items-center justify-between gap-4 pb-2"
          >
            <div className="flex items-center gap-4">
              <div>
                <p className="text-[11px] font-bold tracking-[0.25em] text-[#ff6e00] uppercase mb-1">
                  Master Report · Tráfego Pago
                </p>
                <h1 className="text-3xl font-bold text-white tracking-tight">
                  {clientName || "Visão Geral"}
                </h1>
                <p className="text-sm text-white/40 mt-1">{periodLabel}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {originData.find((d) => d.name === "Meta Ads") && (
                <div className="flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-xs text-white/60">
                  <Facebook className="h-3.5 w-3.5 text-[#1877f2]" /> Meta Ads
                </div>
              )}
              {originData.find((d) => d.name === "Google Ads") && (
                <div className="flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-xs text-white/60">
                  <Search className="h-3.5 w-3.5 text-[#34a853]" /> Google Ads
                </div>
              )}
            </div>
          </header>

          {/* ============ KPIs PRINCIPAIS ============ */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            <KpiCard title="Investimento" value={fmtCurrency(overview.spend?.current || 0)}
              previousValue={fmtCurrency(overview.spend?.previous || 0)}
              change={overview.spend?.change || 0} icon={DollarSign} accent={C.primary} delay={0} />
            <KpiCard title="Impressões" value={fmtNum(overview.impressions?.current || 0)}
              previousValue={fmtNum(overview.impressions?.previous || 0)}
              change={overview.impressions?.change || 0} icon={Eye} accent={C.amber} delay={60} />
            <KpiCard title="Cliques" value={fmtNum(overview.clicks?.current || 0)}
              previousValue={fmtNum(overview.clicks?.previous || 0)}
              change={overview.clicks?.change || 0} icon={MousePointer} accent={C.blue} delay={120} />
            <KpiCard title="Conversões" value={fmtNum(overview.conversions?.current || 0)}
              previousValue={fmtNum(overview.conversions?.previous || 0)}
              change={overview.conversions?.change || 0} icon={Target} accent={C.green} delay={180} />
            <KpiCard title="CTR" value={fmtPct(overview.ctr?.current || 0)}
              previousValue={fmtPct(overview.ctr?.previous || 0)}
              change={overview.ctr?.change || 0} icon={TrendingUp} accent={C.purple} delay={240} />
          </div>

          {/* ============ KPIs SECUNDÁRIOS ============ */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard title="CPC" value={fmtCurrency(overview.cpc?.current || 0)}
              previousValue={fmtCurrency(overview.cpc?.previous || 0)}
              change={overview.cpc?.change || 0} icon={MousePointer} accent={C.blue} delay={0} />
            <KpiCard title="CPA" value={fmtCurrency(overview.cpa?.current || 0)}
              previousValue={fmtCurrency(overview.cpa?.previous || 0)}
              change={overview.cpa?.change || 0} icon={Target} accent={C.green} delay={60} />
            <KpiCard title="CPM" value={fmtCurrency(overview.cpm?.current || 0)}
              previousValue={fmtCurrency(overview.cpm?.previous || 0)}
              change={overview.cpm?.change || 0} icon={Layers} accent={C.amber} delay={120} />
            <KpiCard
              title="Frequência"
              value={fmtDecimal(overview.frequency?.current || metaData?.overview?.frequency?.current || 0, 2)}
              previousValue={fmtDecimal(overview.frequency?.previous || metaData?.overview?.frequency?.previous || 0, 2)}
              change={overview.frequency?.change || 0} icon={Repeat} accent={C.pink} delay={180}
            />
          </div>

          {/* ============ PERFORMANCE TEMPORAL ============ */}
          {(mergedSeries.length > 0) && (
            <GlassCard id={SECTION_ID('performance')}>
              <SectionTitle icon={BarChart3} label="Performance ao longo do tempo" hint={`${mergedSeries.length} dias`} />
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={mergedSeries}>
                    <defs>
                      <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={C.green} stopOpacity={0.4} />
                        <stop offset="100%" stopColor={C.green} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(1)}k`} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#0B0F1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }}
                      formatter={(v: any, n: any) => {
                        if (n === 'meta' || n === 'google' || n === 'spend') return [fmtCurrency(v), n === 'meta' ? 'Meta' : n === 'google' ? 'Google' : 'Investimento'];
                        if (n === 'conversions') return [fmtNum(v), 'Conversões'];
                        return [v, n];
                      }}
                    />
                    {showCrossPlatform ? (
                      <>
                        <Bar yAxisId="left" dataKey="meta" stackId="a" fill={C.meta} radius={[0, 0, 0, 0]} />
                        <Bar yAxisId="left" dataKey="google" stackId="a" fill={C.google} radius={[6, 6, 0, 0]} />
                      </>
                    ) : (
                      <Bar yAxisId="left" dataKey="spend" fill={C.primary} radius={[6, 6, 0, 0]} />
                    )}
                    <Area yAxisId="right" type="monotone" dataKey="conversions" stroke={C.green} strokeWidth={2} fill="url(#convGrad)" />
                    <Legend wrapperStyle={{ paddingTop: 12 }} iconType="circle" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          )}

          {/* ============ PLATAFORMAS LADO A LADO ============ */}
          {(metaSeries.length > 0 || googleSeries.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {metaSeries.length > 0 && (
                <div id={SECTION_ID('meta-ads')}>
                  <PlatformBlock
                    title="Meta Ads" icon={Facebook} accent={C.meta} series={metaSeries.map(p => ({ date: p.date, value: p.spend, conversions: p.conversions, clicks: p.clicks }))}
                    totalLabel="Investimento" totalValue={fmtCurrency(metaSpend)}
                    metrics={[
                      { label: "Cliques", value: fmtNum(metaData?.overview?.clicks?.current || 0) },
                      { label: "Conversões", value: fmtNum(metaData?.overview?.conversions?.current || 0) },
                      { label: "CPA", value: fmtCurrency(metaData?.overview?.cpa?.current || 0) },
                    ]}
                  />
                </div>
              )}
              {googleSeries.length > 0 && (
                <div id={SECTION_ID('google-ads')}>
                  <PlatformBlock
                    title="Google Ads" icon={Search} accent={C.google} series={googleSeries.map(p => ({ date: p.date, value: p.spend, conversions: p.conversions, clicks: p.clicks }))}
                    totalLabel="Investimento" totalValue={fmtCurrency(googleSpend)}
                    metrics={[
                      { label: "Cliques", value: fmtNum(googleData?.overview?.clicks?.current || 0) },
                      { label: "Conversões", value: fmtNum(googleData?.overview?.conversions?.current || 0) },
                      { label: "CPA", value: fmtCurrency(googleData?.overview?.cpa?.current || 0) },
                    ]}
                  />
                </div>
              )}
            </div>
          )}

          {/* ============ FUNIL DE CONVERSÃO ============ */}
          <GlassCard id={SECTION_ID('funnel')}>
            <SectionTitle icon={Target} label="Funil de Conversão" hint="Da impressão à conversão" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {[
                { label: 'Impressões', value: overview.impressions?.current || 0, icon: Eye, color: C.amber, fmt: fmtNum },
                { label: 'Cliques', value: overview.clicks?.current || 0, icon: MousePointer, color: C.blue, fmt: fmtNum },
                { label: 'Conversões', value: overview.conversions?.current || 0, icon: Target, color: C.green, fmt: fmtNum },
                { label: 'Investimento', value: overview.spend?.current || 0, icon: DollarSign, color: C.primary, fmt: fmtCurrency },
              ].map((stage, i, arr) => {
                const prev = i > 0 ? arr[i - 1].value : stage.value;
                const rate = i > 0 && prev > 0 && i < 3 ? (stage.value / prev) * 100 : null;
                const Icon = stage.icon;
                return (
                  <div key={stage.label} className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: `${stage.color}1A`, color: stage.color }}>
                        <Icon className="h-4 w-4" />
                      </div>
                      {rate !== null && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/5 text-white/60">
                          {rate.toFixed(2)}% conv.
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] uppercase tracking-wider text-white/55 mb-1">{stage.label}</p>
                    <p className="text-2xl font-bold text-white tracking-tight">{stage.fmt(stage.value)}</p>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          {/* ============ AUDIÊNCIA — IDADE / GÊNERO / REGIÃO ============ */}
          {(byAge.length > 0 || byGender.length > 0 || byLocation.length > 0) && (
            <GlassCard id={SECTION_ID('audience')}>
              <SectionTitle icon={UsersIcon} label="Audiência" hint="Demografia & geografia" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Idade */}
                {byAge.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-white/60 mb-3 flex items-center gap-1.5">
                      <BarChart3 className="h-3.5 w-3.5" /> Por faixa etária
                    </p>
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={byAge} layout="vertical" margin={{ left: 8 }}>
                          <CartesianGrid stroke="rgba(255,255,255,0.04)" horizontal={false} />
                          <XAxis type="number" axisLine={false} tickLine={false} />
                          <YAxis dataKey="label" type="category" axisLine={false} tickLine={false} width={48} />
                          <Tooltip contentStyle={{ background: '#0B0F1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }} formatter={(v: any) => fmtNum(v)} />
                          <Bar dataKey="conversions" fill={C.primary} radius={[0, 6, 6, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Gênero */}
                {byGender.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-white/60 mb-3 flex items-center gap-1.5">
                      <PieIcon className="h-3.5 w-3.5" /> Por gênero
                    </p>
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={byGender} dataKey="conversions" nameKey="label" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                            {byGender.map((g: any, i: number) => (
                              <Cell key={i} fill={genderColors[String(g.label).toLowerCase()] || [C.primary, C.purple, C.blue, C.amber][i % 4]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ background: '#0B0F1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }} formatter={(v: any) => fmtNum(v)} />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Região */}
                {byLocation.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-white/60 mb-3 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" /> Top regiões
                    </p>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2">
                      {byLocation.slice(0, 8).map((r: any, i: number) => {
                        const max = byLocation[0].value || 1;
                        const pct = (r.value / max) * 100;
                        return (
                          <div key={i}>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-white/70 truncate pr-2">{r.label}</span>
                              <span className="font-semibold text-white shrink-0">{fmtNum(r.value)}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${C.primary}, ${C.purple})` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>
          )}

          {/* ============ TOP CRIATIVOS ============ */}
          {(() => {
            const metaTopAds = (topAds || []).filter((a: any) => a.platform === 'meta');
            if (metaTopAds.length === 0) return null;
            return (
              <GlassCard id={SECTION_ID('creatives')}>
                <SectionTitle icon={Award} label="Top Criativos (Meta)" hint={`${Math.min(metaTopAds.length, 10)} melhores`} />
                <TopCreativesSection topAds={topAds} limit={10} />
              </GlassCard>
            );
          })()}

          {/* ============ TABELA DE CAMPANHAS ============ */}
          {campaigns && campaigns.length > 0 && (
            <GlassCard id={SECTION_ID('campaigns')}>
              <SectionTitle icon={Filter} label="Campanhas" hint={`${campaigns.length} campanhas`} />
              <CampaignsInsightsTable
                campaigns={campaigns}
                showPlatformFilter={platform === 'both'}
              />
            </GlassCard>
          )}

          {/* Footer */}
          <div className="pt-8 pb-4 text-center">
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/20">
              Powered by <span className="text-[#ff6e00]/60">Muran</span> · Master Report
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
