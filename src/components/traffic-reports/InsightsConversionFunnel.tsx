import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown, Eye, MousePointerClick, Target } from "lucide-react";
import { formatCurrency, formatNumber, calculatePercentage } from "@/utils/chartUtils";

interface FunnelData {
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  cpc: number;
  cpa: number;
}

interface InsightsConversionFunnelProps {
  data: FunnelData;
  platform: 'meta' | 'google' | 'both';
}

export const InsightsConversionFunnel = ({ data, platform }: InsightsConversionFunnelProps) => {
  const { impressions, clicks, conversions, spend, cpc, cpa } = data;

  // Calcular taxas
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;
  const overallConversionRate = impressions > 0 ? (conversions / impressions) * 100 : 0;

  const stages = [
    {
      label: "Impressões",
      value: impressions,
      percentage: 100,
      icon: Eye,
      color: "bg-blue-500",
      metric: formatCurrency(spend),
      metricLabel: "Investimento Total",
    },
    {
      label: "Cliques",
      value: clicks,
      percentage: calculatePercentage(clicks, impressions),
      icon: MousePointerClick,
      color: "bg-muran-primary",
      metric: formatCurrency(cpc),
      metricLabel: "CPC Médio",
      rate: ctr,
      rateLabel: "CTR",
    },
    {
      label: "Conversões",
      value: conversions,
      percentage: calculatePercentage(conversions, impressions),
      icon: Target,
      color: "bg-green-500",
      metric: formatCurrency(cpa),
      metricLabel: "CPA Médio",
      rate: conversionRate,
      rateLabel: "Taxa Conv.",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-muran-primary" />
          Funil de Conversão
          {platform !== 'both' && (
            <span className="text-sm font-normal text-muted-foreground">
              ({platform === 'meta' ? 'Meta Ads' : 'Google Ads'})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            const width = `${Math.max(stage.percentage, 15)}%`;
            
            return (
              <div key={stage.label} className="space-y-2">
                {/* Estágio do funil */}
                <div 
                  className="relative mx-auto transition-all duration-300 hover:scale-[1.02]"
                  style={{ width }}
                >
                  <div className={`${stage.color} rounded-lg p-4 shadow-lg`}>
                    <div className="flex items-center justify-between text-white">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        <span className="font-semibold">{stage.label}</span>
                      </div>
                      <span className="text-sm opacity-90">
                        {stage.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="mt-2 space-y-1">
                      <div className="text-2xl font-bold text-white">
                        {formatNumber(stage.value)}
                      </div>
                      <div className="text-xs text-white/80">
                        {stage.metricLabel}: {stage.metric}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Taxa de conversão entre estágios */}
                {index < stages.length - 1 && stage.rate !== undefined && (
                  <div className="flex items-center justify-center gap-2 py-2">
                    <ArrowDown className="h-4 w-4 text-muted-foreground animate-bounce" />
                    <span className="text-sm font-medium text-muted-foreground">
                      {stage.rateLabel}: {stage.rate.toFixed(2)}%
                    </span>
                    <ArrowDown className="h-4 w-4 text-muted-foreground animate-bounce" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Resumo final */}
          <div className="mt-6 rounded-lg bg-muted/50 p-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Taxa de Conversão Geral</div>
              <div className="text-2xl font-bold text-muran-primary">
                {overallConversionRate.toFixed(3)}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                De {formatNumber(impressions)} impressões para {formatNumber(conversions)} conversões
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
