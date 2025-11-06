import { Card } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Eye, MousePointer, Target, TrendingUp, DollarSign, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  previousValue?: number;
  change?: number;
  icon: React.ReactNode;
  format?: 'number' | 'currency' | 'percentage';
}

function MetricCard({ title, value, previousValue, change, icon, format = 'number' }: MetricCardProps) {
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
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="p-2 bg-muran-primary/10 rounded-lg">
          {icon}
        </div>
        {change !== undefined && (
          <div className={cn(
            "flex items-center gap-1 text-sm font-medium",
            isPositive && "text-green-600",
            isNegative && "text-red-600"
          )}>
            {isPositive ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
      
      <div>
        <p className="text-sm text-muted-foreground mb-1">{title}</p>
        <p className="text-2xl font-bold">{formatValue(value)}</p>
        {previousValue !== undefined && (
          <p className="text-xs text-muted-foreground mt-1">
            Anterior: {formatValue(previousValue)}
          </p>
        )}
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
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Visão Geral</h2>
      
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
