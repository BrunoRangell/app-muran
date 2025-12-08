import { TrendingUp, TrendingDown, Minus, Eye, MousePointer, Target, DollarSign, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricValue {
  current: number;
  previous: number;
  change: number;
}

interface OverviewData {
  impressions: MetricValue;
  reach?: MetricValue;
  clicks: MetricValue;
  ctr: MetricValue;
  conversions: MetricValue;
  spend: MetricValue;
  cpa: MetricValue;
  cpc: MetricValue;
}

interface CombinedOverviewProps {
  combined: OverviewData;
  meta?: OverviewData;
  google?: OverviewData;
}

interface MetricCardProps {
  title: string;
  icon: React.ReactNode;
  combined: number;
  meta?: number;
  google?: number;
  change: number;
  format?: 'number' | 'currency' | 'percentage';
}

function MetricCard({ title, icon, combined, meta, google, change, format = 'number' }: MetricCardProps) {
  const formatValue = (value: number) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
      case 'percentage':
        return `${value.toFixed(2)}%`;
      case 'number':
      default:
        return new Intl.NumberFormat('pt-BR').format(Math.round(value));
    }
  };

  const changeColor = change > 0 ? 'text-green-500' : change < 0 ? 'text-red-500' : 'text-muted-foreground';
  const ChangeIcon = change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus;

  return (
    <div className="glass-card p-5 rounded-xl border border-border/30 hover:border-muran-primary/30 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className="p-2.5 rounded-lg bg-gradient-to-br from-muran-primary/10 to-muran-primary/5 border border-muran-primary/20 group-hover:from-muran-primary/20 transition-colors">
          {icon}
        </div>
        <div className={cn("flex items-center gap-1 text-sm font-medium", changeColor)}>
          <ChangeIcon className="h-4 w-4" />
          <span>{Math.abs(change).toFixed(1)}%</span>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-1">{title}</p>
      <p className="text-2xl font-bold mb-3">{formatValue(combined)}</p>

      {/* Breakdown por plataforma */}
      {(meta !== undefined || google !== undefined) && (
        <div className="flex gap-3 pt-3 border-t border-border/30">
          {meta !== undefined && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-xs text-muted-foreground">Meta:</span>
              <span className="text-xs font-medium">{formatValue(meta)}</span>
            </div>
          )}
          {google !== undefined && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-xs text-muted-foreground">Google:</span>
              <span className="text-xs font-medium">{formatValue(google)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function CombinedOverview({ combined, meta, google }: CombinedOverviewProps) {
  const metrics = [
    {
      title: 'Impressões',
      icon: <Eye className="h-5 w-5 text-muran-primary" />,
      combined: combined.impressions.current,
      meta: meta?.impressions.current,
      google: google?.impressions.current,
      change: combined.impressions.change,
      format: 'number' as const
    },
    {
      title: 'Cliques',
      icon: <MousePointer className="h-5 w-5 text-muran-primary" />,
      combined: combined.clicks.current,
      meta: meta?.clicks.current,
      google: google?.clicks.current,
      change: combined.clicks.change,
      format: 'number' as const
    },
    {
      title: 'CTR',
      icon: <BarChart3 className="h-5 w-5 text-muran-primary" />,
      combined: combined.ctr.current,
      meta: meta?.ctr.current,
      google: google?.ctr.current,
      change: combined.ctr.change,
      format: 'percentage' as const
    },
    {
      title: 'Conversões',
      icon: <Target className="h-5 w-5 text-muran-primary" />,
      combined: combined.conversions.current,
      meta: meta?.conversions.current,
      google: google?.conversions.current,
      change: combined.conversions.change,
      format: 'number' as const
    },
    {
      title: 'Investimento',
      icon: <DollarSign className="h-5 w-5 text-muran-primary" />,
      combined: combined.spend.current,
      meta: meta?.spend.current,
      google: google?.spend.current,
      change: combined.spend.change,
      format: 'currency' as const
    },
    {
      title: 'CPA',
      icon: <Target className="h-5 w-5 text-muran-primary" />,
      combined: combined.cpa.current,
      meta: meta?.cpa.current,
      google: google?.cpa.current,
      change: combined.cpa.change,
      format: 'currency' as const
    },
    {
      title: 'CPC',
      icon: <MousePointer className="h-5 w-5 text-muran-primary" />,
      combined: combined.cpc.current,
      meta: meta?.cpc.current,
      google: google?.cpc.current,
      change: combined.cpc.change,
      format: 'currency' as const
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold">Métricas Combinadas</h2>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Meta Ads</span>
          </div>
          <span>+</span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span>Google Ads</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>
    </div>
  );
}
