import { Card } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Eye, MousePointer, Target, TrendingUp, DollarSign, Calculator, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  previousValue?: number;
  change?: number;
  icon: React.ReactNode;
  format?: 'number' | 'currency' | 'percentage';
  accentColor?: string;
}

function MetricCard({ title, value, previousValue, change, icon, format = 'number', accentColor = 'muran-primary' }: MetricCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val;
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
      case 'percentage':
        return `${val.toFixed(2)}%`;
      default:
        return new Intl.NumberFormat('pt-BR').format(val);
    }
  };

  const isPositive = change ? change > 0 : false;
  const isNegative = change ? change < 0 : false;

  return (
    <Card className="glass-card group relative overflow-hidden p-6 transition-all duration-300 hover:shadow-lg hover:shadow-muran-primary/10 hover:-translate-y-1">
      {/* Gradient accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-muran-primary to-muran-primary-glow opacity-80" />
      
      {/* Background glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-muran-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative space-y-4">
        <div className="flex items-center justify-between">
          <div className="p-2.5 bg-gradient-to-br from-muran-primary/20 to-muran-primary/10 rounded-xl border border-muran-primary/20 shadow-inner">
            {icon}
          </div>
          {change !== undefined && change !== 0 && (
            <div className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold",
              isPositive && "bg-green-500/10 text-green-600 dark:text-green-400",
              isNegative && "bg-red-500/10 text-red-600 dark:text-red-400"
            )}>
              {isPositive ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
              {Math.abs(change).toFixed(1)}%
            </div>
          )}
        </div>
        
        <div>
          <p className="text-sm text-muted-foreground font-medium mb-1.5">{title}</p>
          <p className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
            {formatValue(value)}
          </p>
          {previousValue !== undefined && previousValue > 0 && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <span className="opacity-60">Anterior:</span>
              <span className="font-medium">{formatValue(previousValue)}</span>
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

interface InsightsOverviewProps {
  overview: {
    impressions: { current: number; previous: number; change: number };
    reach: { current: number; previous: number; change: number };
    clicks: { current: number; previous: number; change: number };
    ctr: { current: number; previous: number; change: number };
    conversions: { current: number; previous: number; change: number };
    spend: { current: number; previous: number; change: number };
    cpa: { current: number; previous: number; change: number };
    cpc: { current: number; previous: number; change: number };
  };
  platform: 'meta' | 'google' | 'both';
}

export function InsightsOverview({ overview, platform }: InsightsOverviewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-muran-primary/20 to-muran-primary/10 border border-muran-primary/20">
          <Zap className="h-5 w-5 text-muran-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Visão Geral</h2>
          <p className="text-sm text-muted-foreground">Métricas de performance do período selecionado</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Impressões"
          value={overview.impressions.current}
          previousValue={overview.impressions.previous}
          change={overview.impressions.change}
          icon={<Eye className="h-5 w-5 text-muran-primary" />}
        />

        {platform === 'meta' && overview.reach.current > 0 && (
          <MetricCard
            title="Alcance"
            value={overview.reach.current}
            previousValue={overview.reach.previous}
            change={overview.reach.change}
            icon={<TrendingUp className="h-5 w-5 text-muran-primary" />}
          />
        )}

        <MetricCard
          title="Cliques"
          value={overview.clicks.current}
          previousValue={overview.clicks.previous}
          change={overview.clicks.change}
          icon={<MousePointer className="h-5 w-5 text-muran-primary" />}
        />

        <MetricCard
          title="CTR"
          value={overview.ctr.current}
          previousValue={overview.ctr.previous}
          change={overview.ctr.change}
          icon={<Calculator className="h-5 w-5 text-muran-primary" />}
          format="percentage"
        />

        <MetricCard
          title="Conversões"
          value={overview.conversions.current}
          previousValue={overview.conversions.previous}
          change={overview.conversions.change}
          icon={<Target className="h-5 w-5 text-muran-primary" />}
        />

        <MetricCard
          title="Investimento"
          value={overview.spend.current}
          previousValue={overview.spend.previous}
          change={overview.spend.change}
          icon={<DollarSign className="h-5 w-5 text-muran-primary" />}
          format="currency"
        />

        <MetricCard
          title="CPA"
          value={overview.cpa.current}
          previousValue={overview.cpa.previous}
          change={overview.cpa.change}
          icon={<Calculator className="h-5 w-5 text-muran-primary" />}
          format="currency"
        />

        <MetricCard
          title="CPC"
          value={overview.cpc.current}
          previousValue={overview.cpc.previous}
          change={overview.cpc.change}
          icon={<Calculator className="h-5 w-5 text-muran-primary" />}
          format="currency"
        />
      </div>
    </div>
  );
}
