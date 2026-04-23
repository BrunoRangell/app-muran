import { useMemo } from "react";
import {
  Eye, MousePointer, Target, TrendingUp, DollarSign,
  Facebook, Search, BarChart3, Filter, Download,
} from "lucide-react";
import { SidebarNav } from "./dashcortex/SidebarNav";
import { KpiCard } from "./dashcortex/KpiCard";
import { PlatformBlock } from "./dashcortex/PlatformBlock";
import { RegionTable } from "./dashcortex/RegionTable";
import { OriginPieChart } from "./dashcortex/OriginPieChart";
import { BudgetCard } from "./dashcortex/BudgetCard";

interface DashCortexTemplateProps {
  data: any;
  clientName?: string;
  dateRange?: { start: string; end: string };
}

const fmtNum = (v: number) => new Intl.NumberFormat("pt-BR").format(Math.round(v || 0));
const fmtCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const fmtPct = (v: number) => `${(v || 0).toFixed(2)}%`;

export function DashCortexTemplate({ data, clientName, dateRange }: DashCortexTemplateProps) {
  // Normalizar dados (suporta platform='both' ou single)
  const normalized = useMemo(() => {
    if (!data) return null;

    const overview = data.overview || {};
    const metaData = data.metaData;
    const googleData = data.googleData;

    const metaSeries = (metaData?.timeSeries || []).slice(-14).map((p: any) => ({
      date: new Date(p.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      value: p.spend || 0,
      conversions: p.conversions || 0,
      clicks: p.clicks || 0,
    }));

    const googleSeries = (googleData?.timeSeries || []).slice(-14).map((p: any) => ({
      date: new Date(p.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      value: p.spend || 0,
      conversions: p.conversions || 0,
      clicks: p.clicks || 0,
    }));

    // Para single-platform, derivar do timeSeries principal
    const mainSeries = (data.timeSeries || []).slice(-14).map((p: any) => ({
      date: new Date(p.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      value: p.spend || 0,
      conversions: p.conversions || 0,
      clicks: p.clicks || 0,
    }));

    const isMeta = data.platform === "meta";
    const isGoogle = data.platform === "google";

    const finalMetaSeries = metaSeries.length > 0 ? metaSeries : (isMeta ? mainSeries : []);
    const finalGoogleSeries = googleSeries.length > 0 ? googleSeries : (isGoogle ? mainSeries : []);

    // Demographics — região
    const demographics = metaData?.demographics || googleData?.demographics || data.demographics;
    const regions = (demographics?.byLocation || demographics?.locations || []).map((r: any) => ({
      label: r.label || r.location || r.region || "—",
      value: r.conversions || r.value || r.clicks || 0,
    })).sort((a: any, b: any) => b.value - a.value);

    // Origem dos acessos (donut)
    const metaSpendTotal = metaData?.overview?.spend?.current || (isMeta ? overview.spend?.current : 0) || 0;
    const googleSpendTotal = googleData?.overview?.spend?.current || (isGoogle ? overview.spend?.current : 0) || 0;
    const metaImpr = metaData?.overview?.impressions?.current || (isMeta ? overview.impressions?.current : 0) || 0;
    const googleImpr = googleData?.overview?.impressions?.current || (isGoogle ? overview.impressions?.current : 0) || 0;

    const originData = [
      { name: "Meta Ads", value: metaImpr, color: "#1877f2" },
      { name: "Google Ads", value: googleImpr, color: "#34a853" },
    ].filter((d) => d.value > 0);

    return {
      overview,
      metaData,
      googleData,
      metaSeries: finalMetaSeries,
      googleSeries: finalGoogleSeries,
      regions,
      originData,
      metaSpendTotal,
      googleSpendTotal,
    };
  }, [data]);

  if (!normalized) return null;

  const { overview, metaData, googleData, metaSeries, googleSeries, regions, originData, metaSpendTotal, googleSpendTotal } = normalized;

  const periodLabel = dateRange
    ? `${new Date(dateRange.start).toLocaleDateString("pt-BR")} — ${new Date(dateRange.end).toLocaleDateString("pt-BR")}`
    : "Período atual";

  return (
    <div className="dashcortex-root -mx-4 sm:-mx-6 lg:-mx-8 -mt-6 px-4 sm:px-6 lg:px-8 py-6 min-h-screen" style={{ background: "#0B0F1A" }}>
      <style>{`
        .dashcortex-root { font-family: 'Space Grotesk', -apple-system, sans-serif; }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="flex gap-6 max-w-[1600px] mx-auto">
        <SidebarNav active="overview" />

        <div className="flex-1 min-w-0 space-y-6">
          {/* Header */}
          <header
            id="dashcortex-section-overview"
            className="flex flex-wrap items-center justify-between gap-4 pb-2"
          >
            <div className="flex items-center gap-4">
              <div>
                <p className="text-[11px] font-bold tracking-[0.25em] text-[#ff6e00] uppercase mb-1">
                  Dashboard Premium
                </p>
                <h1 className="text-3xl font-bold text-white tracking-tight">
                  Overview {clientName && <span className="text-white/50 font-normal">· {clientName}</span>}
                </h1>
                <p className="text-sm text-white/40 mt-1">{periodLabel}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {originData.find((d) => d.name === "Meta Ads") && (
                <div className="flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-xs text-white/60">
                  <Facebook className="h-3.5 w-3.5 text-[#1877f2]" /> Meta
                </div>
              )}
              {originData.find((d) => d.name === "Google Ads") && (
                <div className="flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-xs text-white/60">
                  <Search className="h-3.5 w-3.5 text-[#34a853]" /> Google
                </div>
              )}
              <button className="flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-xs text-white/60 hover:bg-white/[0.06] transition">
                <Filter className="h-3.5 w-3.5" /> Filtros
              </button>
              <button className="flex items-center gap-1.5 rounded-full border border-[#ff6e00]/30 bg-[#ff6e00]/10 px-3 py-1.5 text-xs text-[#ff6e00] hover:bg-[#ff6e00]/20 transition">
                <Download className="h-3.5 w-3.5" /> Exportar
              </button>
            </div>
          </header>

          {/* KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            <KpiCard
              title="Impressões"
              value={fmtNum(overview.impressions?.current || 0)}
              previousValue={fmtNum(overview.impressions?.previous || 0)}
              change={overview.impressions?.change || 0}
              icon={Eye}
              accent="#ff6e00"
              delay={0}
            />
            <KpiCard
              title="Cliques"
              value={fmtNum(overview.clicks?.current || 0)}
              previousValue={fmtNum(overview.clicks?.previous || 0)}
              change={overview.clicks?.change || 0}
              icon={MousePointer}
              accent="#3b82f6"
              delay={80}
            />
            <KpiCard
              title="Conversões"
              value={fmtNum(overview.conversions?.current || 0)}
              previousValue={fmtNum(overview.conversions?.previous || 0)}
              change={overview.conversions?.change || 0}
              icon={Target}
              accent="#10b981"
              delay={160}
            />
            <KpiCard
              title="CTR"
              value={fmtPct(overview.ctr?.current || 0)}
              previousValue={fmtPct(overview.ctr?.previous || 0)}
              change={overview.ctr?.change || 0}
              icon={TrendingUp}
              accent="#f59e0b"
              delay={240}
            />
            <KpiCard
              title="Investimento"
              value={fmtCurrency(overview.spend?.current || 0)}
              previousValue={fmtCurrency(overview.spend?.previous || 0)}
              change={overview.spend?.change || 0}
              icon={DollarSign}
              accent="#a855f7"
              delay={320}
            />
          </div>

          {/* Budget Card */}
          {(metaSpendTotal > 0 || googleSpendTotal > 0) && (
            <BudgetCard metaSpend={metaSpendTotal} googleSpend={googleSpendTotal} />
          )}

          {/* Platform blocks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {metaSeries.length > 0 && (
              <div id="dashcortex-section-meta-ads">
                <PlatformBlock
                  title="Meta Ads"
                  icon={Facebook}
                  accent="#1877f2"
                  series={metaSeries}
                  totalLabel="Investimento"
                  totalValue={fmtCurrency(metaSpendTotal)}
                  metrics={[
                    { label: "Cliques", value: fmtNum(metaData?.overview?.clicks?.current || 0) },
                    { label: "Conversões", value: fmtNum(metaData?.overview?.conversions?.current || 0) },
                    { label: "CPA", value: fmtCurrency(metaData?.overview?.cpa?.current || 0) },
                  ]}
                />
              </div>
            )}
            {googleSeries.length > 0 && (
              <div id="dashcortex-section-google-ads">
                <PlatformBlock
                  title="Google Ads"
                  icon={Search}
                  accent="#34a853"
                  series={googleSeries}
                  totalLabel="Investimento"
                  totalValue={fmtCurrency(googleSpendTotal)}
                  metrics={[
                    { label: "Cliques", value: fmtNum(googleData?.overview?.clicks?.current || 0) },
                    { label: "Conversões", value: fmtNum(googleData?.overview?.conversions?.current || 0) },
                    { label: "CPA", value: fmtCurrency(googleData?.overview?.cpa?.current || 0) },
                  ]}
                />
              </div>
            )}
          </div>

          {/* Origem + Região */}
          <div id="dashcortex-section-analytics" className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {originData.length > 0 && <OriginPieChart data={originData} />}
            {regions.length > 0 && <RegionTable regions={regions} />}
          </div>

          {/* Footer subtle */}
          <div className="pt-8 pb-4 text-center">
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/20">
              Powered by <span className="text-[#ff6e00]/60">Muran</span> · DashCortex Premium
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
