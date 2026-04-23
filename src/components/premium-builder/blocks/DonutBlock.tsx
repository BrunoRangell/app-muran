import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { PremiumBlockRenderer } from '../registry';
import { formatMetric, METRIC_LABEL } from '../renderer/format';
import { MetricKey } from '@/types/template-editor';

function buildSlices(source: 'platform' | 'gender' | 'age', metric: MetricKey, data: any, accent: string) {
  if (source === 'platform') {
    const meta = data.metaData?.overview?.[metric]?.current ?? (data.platform === 'meta' ? data.overview?.[metric]?.current : 0) ?? 0;
    const google = data.googleData?.overview?.[metric]?.current ?? (data.platform === 'google' ? data.overview?.[metric]?.current : 0) ?? 0;
    return [
      { name: 'Meta Ads', value: meta, color: '#1877f2' },
      { name: 'Google Ads', value: google, color: '#34a853' },
    ].filter((s) => s.value > 0);
  }
  if (source === 'gender') {
    const list = data.demographics?.gender || [];
    const palette = [accent, '#3b82f6', '#a855f7', '#10b981'];
    return list.map((r: any, i: number) => ({
      name: r.gender || r.label || '—',
      value: r[metric] ?? r.value ?? 0,
      color: palette[i % palette.length],
    })).filter((s: any) => s.value > 0);
  }
  if (source === 'age') {
    const list = data.demographics?.age || [];
    const palette = [accent, '#3b82f6', '#a855f7', '#10b981', '#f59e0b', '#ec4899'];
    return list.map((r: any, i: number) => ({
      name: r.range || r.label || '—',
      value: r[metric] ?? r.value ?? 0,
      color: palette[i % palette.length],
    })).filter((s: any) => s.value > 0);
  }
  return [];
}

export const DonutBlock: PremiumBlockRenderer = ({ block, data }) => {
  const cfg = block.config;
  const source = cfg.donutSource || 'platform';
  const metric = cfg.metric || 'impressions';
  const accent = cfg.accent || '#ff6e00';
  const showLegend = cfg.showLegend !== false;
  const title = cfg.title || (source === 'platform' ? 'Origem dos acessos' : source === 'gender' ? 'Por gênero' : 'Por faixa etária');

  const slices = buildSlices(source, metric, data, accent);
  const total = slices.reduce((s, x) => s + x.value, 0);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-6 backdrop-blur-xl h-full flex flex-col">
      <div className="mb-3">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <p className="text-[11px] text-white/40">{METRIC_LABEL[metric]}</p>
      </div>
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_140px] gap-4 min-h-[180px]">
        <div className="relative">
          {slices.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={slices} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={2}>
                  {slices.map((s, i) => (<Cell key={i} fill={s.color} stroke="none" />))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15,18,30,0.95)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12, color: '#fff', fontSize: 12,
                  }}
                  formatter={(v: any) => formatMetric(metric, v as number)}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-white/40">Sem dados</div>
          )}
        </div>
        {showLegend && (
          <div className="flex flex-col justify-center gap-2">
            {slices.map((s, i) => {
              const pct = total > 0 ? (s.value / total) * 100 : 0;
              return (
                <div key={i} className="space-y-0.5">
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                    <span className="text-white/70 truncate">{s.name}</span>
                  </div>
                  <p className="text-sm font-semibold text-white pl-4">{pct.toFixed(1)}%</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
