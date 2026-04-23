import { ArrowUpRight, ArrowDownRight, Eye, MousePointer, Target, TrendingUp, DollarSign, Calculator, Zap, MessageCircle, Video, Activity } from 'lucide-react';
import { MetricKey } from '@/types/template-editor';
import { PremiumBlockRenderer } from '../registry';
import { cn } from '@/lib/utils';
import { formatMetric, METRIC_LABEL } from '../renderer/format';

const ICONS: Record<MetricKey, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  impressions: Eye, reach: Activity, clicks: MousePointer, ctr: TrendingUp,
  conversions: Target, spend: DollarSign, cpa: Calculator, cpc: Calculator,
  cpm: Calculator, frequency: Zap, videoViews: Video, messages: MessageCircle,
};

export const KpiBlock: PremiumBlockRenderer = ({ block, data }) => {
  const { metric = 'impressions', accent = '#ff6e00', showComparison = true, title } = block.config;
  const Icon = ICONS[metric] || Eye;
  const m = data.overview?.[metric];
  const current = m?.current ?? 0;
  const previous = m?.previous ?? 0;
  const change = m?.change ?? 0;
  const isPositive = change >= 0;
  const progress = Math.min(Math.abs(change), 100);
  const label = title || METRIC_LABEL[metric];

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-5 backdrop-blur-xl transition-all duration-500 hover:border-white/[0.12] hover:-translate-y-1 h-full"
      style={{ boxShadow: `0 8px 32px -12px ${accent}15` }}
    >
      <div
        className="absolute -top-12 -right-12 h-32 w-32 rounded-full opacity-20 blur-3xl transition-opacity duration-500 group-hover:opacity-40"
        style={{ background: accent }}
      />
      <div className="relative flex items-start justify-between mb-5">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10"
          style={{ background: `linear-gradient(135deg, ${accent}30, ${accent}10)` }}
        >
          <Icon className="h-5 w-5" style={{ color: accent }} />
        </div>
        {showComparison && change !== 0 && (
          <div
            className={cn(
              'flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
              isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400',
            )}
          >
            {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
      <div className="relative space-y-2">
        <p className="text-[11px] font-medium tracking-wide text-white/40 uppercase">{label}</p>
        <p className="text-2xl font-bold tracking-tight text-white">{formatMetric(metric, current)}</p>
        <div className="pt-2">
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${Math.max(progress, 8)}%`,
                background: `linear-gradient(90deg, ${accent}, ${accent}90)`,
                boxShadow: `0 0 12px ${accent}80`,
              }}
            />
          </div>
          {showComparison && (
            <p className="mt-2 text-[10px] text-white/35">
              Anterior: <span className="text-white/55">{formatMetric(metric, previous)}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
