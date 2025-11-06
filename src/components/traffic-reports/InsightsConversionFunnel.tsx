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
          Jornada de Conversão
          {platform !== 'both' && (
            <span className="text-sm font-normal text-muted-foreground">
              ({platform === 'meta' ? 'Meta Ads' : 'Google Ads'})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            
            return (
              <div key={stage.label} className="relative">
                {/* Card do estágio */}
                <div className="relative h-full">
                  <Card className="border-2 hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6">
                      {/* Header do card */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`${stage.color} p-3 rounded-lg`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-lg">{stage.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {stage.percentage.toFixed(1)}% do total
                          </div>
                        </div>
                      </div>

                      {/* Valor principal */}
                      <div className="text-3xl font-bold mb-2">
                        {formatNumber(stage.value)}
                      </div>

                      {/* Métrica secundária */}
                      <div className="text-sm text-muted-foreground">
                        {stage.metricLabel}
                      </div>
                      <div className="text-lg font-semibold text-muran-primary">
                        {stage.metric}
                      </div>

                      {/* Taxa de conversão */}
                      {stage.rate !== undefined && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              {stage.rateLabel}
                            </span>
                            <span className="text-sm font-bold text-green-600">
                              {stage.rate.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Seta conectora */}
                {index < stages.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                    <div className="bg-background rounded-full p-2 shadow-md border-2 border-muted">
                      <ArrowDown className="h-5 w-5 text-muran-primary rotate-[-90deg]" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Resumo final */}
        <div className="mt-6 p-6 rounded-lg bg-gradient-to-r from-muran-primary/10 to-muran-primary/5 border border-muran-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Taxa de Conversão Geral
              </div>
              <div className="text-xs text-muted-foreground">
                De {formatNumber(impressions)} impressões para {formatNumber(conversions)} conversões
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-muran-primary">
                {overallConversionRate.toFixed(3)}%
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
