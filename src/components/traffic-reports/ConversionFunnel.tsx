import { Card } from "@/components/ui/card";
import { FunnelData } from "@/types/traffic-report";
import { ArrowDown } from "lucide-react";

interface ConversionFunnelProps {
  data: FunnelData;
  platform: 'meta' | 'google';
}

export const ConversionFunnel = ({ data, platform }: ConversionFunnelProps) => {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-BR').format(Math.round(num));
  };

  const formatPercent = (num: number) => {
    return `${num.toFixed(2)}%`;
  };

  const platformColor = platform === 'meta' ? 'bg-muran-primary' : 'bg-blue-600';
  const platformColorLight = platform === 'meta' ? 'bg-muran-primary/20' : 'bg-blue-600/20';

  return (
    <Card className="transition-all duration-300 hover:shadow-lg border-border/50">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className={`h-10 w-1 ${platformColor} rounded-full`} />
          <h3 className="text-lg font-semibold text-foreground">
            Funil de Conversão - {platform === 'meta' ? 'Meta Ads' : 'Google Ads'}
          </h3>
        </div>

      <div className="space-y-4">
        {/* Impressões */}
        <div className="relative">
          <div className={`${platformColor} text-white p-4 rounded-lg`}>
            <div className="flex justify-between items-center">
              <span className="font-semibold">Impressões</span>
              <span className="text-2xl font-bold">{formatNumber(data.impressions)}</span>
            </div>
          </div>
          <div className="flex justify-center py-2">
            <ArrowDown className="text-muted-foreground" size={24} />
          </div>
        </div>

        {/* Cliques */}
        <div className="relative">
          <div className={`${platformColorLight} border-2 ${platformColor.replace('bg-', 'border-')} p-4 rounded-lg`}>
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold">Cliques</span>
              <span className="text-2xl font-bold">{formatNumber(data.clicks)}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Taxa de cliques: {formatPercent(data.clickRate)}
            </div>
          </div>
          <div className="flex justify-center py-2">
            <ArrowDown className="text-muted-foreground" size={24} />
          </div>
        </div>

        {/* Conversões */}
        <div className="relative">
          <div className={`${platformColorLight} border-2 ${platformColor.replace('bg-', 'border-')} p-4 rounded-lg`}>
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold">Conversões</span>
              <span className="text-2xl font-bold">{formatNumber(data.conversions)}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Taxa de conversão: {formatPercent(data.conversionRate)}
            </div>
          </div>
        </div>

        {/* Resumo */}
        <Card className="bg-muted/50 p-4 mt-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Impressões → Cliques</p>
              <p className="font-semibold">{formatPercent(data.clickRate)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Cliques → Conversões</p>
              <p className="font-semibold">{formatPercent(data.conversionRate)}</p>
            </div>
          </div>
        </Card>
      </div>
      </div>
    </Card>
  );
};
