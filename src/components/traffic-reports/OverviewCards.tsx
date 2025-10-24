import { ArrowUp, ArrowDown, Users, Zap, Video, MessageSquare, DollarSign } from "lucide-react";
import { Card } from "@/components/ui/card";
import { OverviewMetrics } from "@/types/traffic-report";
import { cn } from "@/lib/utils";

interface OverviewCardsProps {
  metrics: OverviewMetrics;
}

export const OverviewCards = ({ metrics }: OverviewCardsProps) => {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-BR').format(Math.round(num));
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(num);
  };

  const formatPercent = (num: number) => {
    return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`;
  };

  const cards = [
    {
      icon: Users,
      label: 'Alcance Total',
      value: formatNumber(metrics.reach.current),
      variation: metrics.reach.percentChange,
      absolute: formatNumber(metrics.reach.absoluteChange),
    },
    {
      icon: Zap,
      label: 'Campanhas Ativas',
      value: formatNumber(metrics.boosted.current),
      variation: metrics.boosted.percentChange,
      absolute: formatNumber(metrics.boosted.absoluteChange),
    },
    {
      icon: Video,
      label: 'Visualizações de Vídeo',
      value: formatNumber(metrics.videoViews.current),
      variation: metrics.videoViews.percentChange,
      absolute: formatNumber(metrics.videoViews.absoluteChange),
    },
    {
      icon: MessageSquare,
      label: 'Leads',
      value: formatNumber(metrics.leads.current),
      variation: metrics.leads.percentChange,
      absolute: formatNumber(metrics.leads.absoluteChange),
    },
    {
      icon: DollarSign,
      label: 'Investimento Total',
      value: formatCurrency(metrics.investment.current),
      variation: metrics.investment.percentChange,
      absolute: formatCurrency(metrics.investment.absoluteChange),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isPositive = card.variation >= 0;

        return (
          <Card key={card.label} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 bg-muran-primary/10 rounded-lg">
                <Icon className="h-5 w-5 text-muran-primary" />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-sm font-medium",
                isPositive ? "text-green-600" : "text-red-600"
              )}>
                {isPositive ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                {formatPercent(card.variation)}
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-3xl font-bold text-muran-dark">{card.value}</p>
              <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
              <p className="text-xs text-muted-foreground">
                {isPositive ? '+' : ''}{card.absolute} vs período anterior
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
