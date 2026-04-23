import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, CartesianGrid } from 'recharts';
import { PremiumBlockRenderer } from '../registry';
import { formatMetric, METRIC_LABEL } from '../renderer/format';
import { MetricKey } from '@/types/template-editor';

export const TrendBlock: PremiumBlockRenderer = ({ block, data }) => {
  const cfg = block.config;
  const metric: MetricKey = cfg.metric || 'spend';
  const source = cfg.chartSource || 'combined';
  const accent = cfg.accent || '#ff6e00';
  const title = cfg.title || `Tendência · ${METRIC_LABEL[metric]}`;

  const seriesRaw =
    source === 'meta' ? (data.metaData?.timeSeries || [])
    : source === 'google' ? (data.googleData?.timeSeries || [])
    : (data.timeSeries || []);

  const series = seriesRaw.slice(-30).map((p: any) => ({
    date: new Date(p.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    value: p[metric] || 0,
  }));

  const safeAccent = accent.replace('#', '');

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-6 backdrop-blur-xl h-full flex flex-col">
      <div className="mb-3">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <p className="text-[11px] text-white/40">
          {source === 'meta' ? 'Meta Ads' : source === 'google' ? 'Google Ads' : 'Combinado'}
        </p>
      </div>
      <div className="flex-1 min-h-[160px]">
        {series.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={`tgrad-${safeAccent}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accent} stopOpacity={0.6} />
                  <stop offset="100%" stopColor={accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(15,18,30,0.95)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12, color: '#fff', fontSize: 12,
                }}
                formatter={(v: any) => formatMetric(metric, v as number)}
              />
              <Area type="monotone" dataKey="value" stroke={accent} strokeWidth={2} fill={`url(#tgrad-${safeAccent})`} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-white/40">Sem série temporal</div>
        )}
      </div>
    </div>
  );
};
