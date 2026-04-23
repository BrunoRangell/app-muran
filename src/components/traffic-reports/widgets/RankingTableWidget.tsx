import { MapPin, BarChart3, Image as ImageIcon, Users, UserCircle2 } from "lucide-react";
import { MetricKey, RankingDataSource, METRIC_LABELS } from "@/types/template-editor";

interface RankingTableWidgetProps {
  dataSource: RankingDataSource;
  metric?: MetricKey;
  accent?: string;
  limit?: number;
  title?: string;
  // Data sources
  demographics?: any;
  campaigns?: any[];
  topAds?: any[];
}

const ICONS: Record<RankingDataSource, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  regions: MapPin,
  campaigns: BarChart3,
  creatives: ImageIcon,
  age: Users,
  gender: UserCircle2,
};

const TITLES: Record<RankingDataSource, string> = {
  regions: 'Top Regiões',
  campaigns: 'Top Campanhas',
  creatives: 'Top Criativos',
  age: 'Top Faixas Etárias',
  gender: 'Por Gênero',
};

const SUBTITLES: Record<RankingDataSource, string> = {
  regions: 'Top localidades por performance',
  campaigns: 'Campanhas com melhor desempenho',
  creatives: 'Anúncios destaque',
  age: 'Distribuição por idade',
  gender: 'Distribuição por gênero',
};

const formatValue = (metric: MetricKey, value: number): string => {
  if (metric === 'spend' || metric === 'cpa' || metric === 'cpc' || metric === 'cpm') {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  }
  if (metric === 'ctr') return `${(value || 0).toFixed(2)}%`;
  return new Intl.NumberFormat('pt-BR').format(Math.round(value || 0));
};

function buildItems(
  dataSource: RankingDataSource,
  metric: MetricKey,
  demographics?: any,
  campaigns?: any[],
  topAds?: any[]
): Array<{ label: string; value: number }> {
  if (dataSource === 'regions') {
    const list = demographics?.byLocation || demographics?.locations || demographics?.location || [];
    return list.map((r: any) => ({
      label: r.label || r.location || r.region || (r.city ? `${r.city}${r.state ? '/' + r.state : ''}` : '—'),
      value: r[metric] ?? r.value ?? r.conversions ?? r.clicks ?? 0,
    }));
  }
  if (dataSource === 'age') {
    const list = demographics?.age || [];
    return list.map((r: any) => ({ label: r.range || r.label || '—', value: r[metric] ?? r.value ?? 0 }));
  }
  if (dataSource === 'gender') {
    const list = demographics?.gender || [];
    return list.map((r: any) => ({ label: r.gender || r.label || '—', value: r[metric] ?? r.value ?? 0 }));
  }
  if (dataSource === 'campaigns') {
    return (campaigns || []).map((c: any) => ({
      label: c.name || c.campaign_name || '—',
      value: c[metric] ?? c.metrics?.[metric] ?? 0,
    }));
  }
  if (dataSource === 'creatives') {
    return (topAds || []).map((a: any) => ({
      label: a.name || a.ad_name || '—',
      value: a[metric] ?? a.metrics?.[metric] ?? 0,
    }));
  }
  return [];
}

export function RankingTableWidget({
  dataSource,
  metric = 'conversions',
  accent = '#ff6e00',
  limit = 8,
  title,
  demographics,
  campaigns,
  topAds,
}: RankingTableWidgetProps) {
  const Icon = ICONS[dataSource];
  const items = buildItems(dataSource, metric, demographics, campaigns, topAds)
    .filter((i) => i.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);

  const max = Math.max(...items.map((r) => r.value), 1);
  const finalTitle = title || TITLES[dataSource];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-6 backdrop-blur-xl h-full">
      <div className="flex items-center gap-3 mb-5">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10"
          style={{ background: `linear-gradient(135deg, ${accent}30, ${accent}10)` }}
        >
          <Icon className="h-5 w-5" style={{ color: accent }} />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">{finalTitle}</h3>
          <p className="text-[11px] text-white/40">{SUBTITLES[dataSource]} · {METRIC_LABELS[metric]}</p>
        </div>
      </div>

      <div className="space-y-3 overflow-y-auto" style={{ maxHeight: 'calc(100% - 80px)' }}>
        {items.length === 0 && (
          <p className="text-sm text-white/40 text-center py-6">Sem dados disponíveis</p>
        )}
        {items.map((item, i) => {
          const pct = (item.value / max) * 100;
          return (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs gap-2">
                <span className="text-white/70 font-medium truncate flex items-center gap-2">
                  <span className="text-white/30 text-[10px] font-bold w-4">#{i + 1}</span>
                  {item.label}
                </span>
                <span className="text-white/90 font-semibold whitespace-nowrap">
                  {formatValue(metric, item.value)}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${accent}, ${accent}cc)`,
                    boxShadow: `0 0 10px ${accent}66`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
