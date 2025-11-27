import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, TrendingUp, Target, MousePointerClick, DollarSign } from "lucide-react";
import { formatCurrency, formatNumber } from "@/utils/chartUtils";

interface TopAd {
  id: string;
  name: string;
  platform: 'meta' | 'google';
  creative: {
    thumbnail?: string;
    title?: string;
    body?: string;
    type?: string;
  };
  metrics: {
    impressions: number;
    clicks: number;
    ctr: number;
    conversions: number;
    cpa: number;
    cpc: number;
    spend: number;
  };
}

interface TopCreativesSectionProps {
  topAds: TopAd[];
  limit?: number;
}

type SortOption = 'impressions' | 'ctr' | 'conversions' | 'cpa' | 'spend';

export function TopCreativesSection({ topAds, limit = 10 }: TopCreativesSectionProps) {
  const [sortBy, setSortBy] = useState<SortOption>('impressions');

  const sortedAds = [...topAds].sort((a, b) => {
    switch (sortBy) {
      case 'ctr':
      case 'cpa':
        return b.metrics[sortBy] - a.metrics[sortBy];
      default:
        return b.metrics[sortBy] - a.metrics[sortBy];
    }
  }).slice(0, limit);

  const getRankBadge = (index: number) => {
    if (index === 0) return { icon: "🔥", variant: "default" as const, label: "Top 1" };
    if (index === 1) return { icon: "⭐", variant: "secondary" as const, label: "Top 2" };
    if (index === 2) return { icon: "📈", variant: "outline" as const, label: "Top 3" };
    return { icon: `#${index + 1}`, variant: "outline" as const, label: `Top ${index + 1}` };
  };

  const getBestMetricBadge = (ad: TopAd, allAds: TopAd[]) => {
    const bestCTR = Math.max(...allAds.map(a => a.metrics.ctr));
    const bestCPA = Math.min(...allAds.filter(a => a.metrics.cpa > 0).map(a => a.metrics.cpa));
    const mostConversions = Math.max(...allAds.map(a => a.metrics.conversions));

    if (ad.metrics.ctr === bestCTR) return { label: "Melhor CTR", color: "bg-blue-500" };
    if (ad.metrics.cpa === bestCPA && bestCPA > 0) return { label: "Melhor CPA", color: "bg-green-500" };
    if (ad.metrics.conversions === mostConversions) return { label: "Mais Conversões", color: "muran-gradient" };
    return null;
  };

  return (
    <Card className="glass-card card-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg muran-gradient">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>Top Criativos e Anúncios</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {sortedAds.length} anúncios com melhor performance
              </p>
            </div>
          </div>
          
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="impressions">Por Impressões</SelectItem>
              <SelectItem value="ctr">Por CTR</SelectItem>
              <SelectItem value="conversions">Por Conversões</SelectItem>
              <SelectItem value="cpa">Por CPA</SelectItem>
              <SelectItem value="spend">Por Investimento</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedAds.map((ad, index) => {
            const rankBadge = getRankBadge(index);
            const bestMetric = getBestMetricBadge(ad, sortedAds);

            return (
              <Card 
                key={ad.id} 
                className="relative overflow-hidden border-2 hover:border-muran-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-xl"
              >
                {/* Rank Badge */}
                <div className="absolute top-3 left-3 z-10">
                  <Badge variant={rankBadge.variant} className="font-bold">
                    {rankBadge.icon}
                  </Badge>
                </div>

                {/* Best Metric Badge */}
                {bestMetric && (
                  <div className="absolute top-3 right-3 z-10">
                    <Badge className={`${bestMetric.color} text-white border-0`}>
                      {bestMetric.label}
                    </Badge>
                  </div>
                )}

                {/* Creative Preview */}
                <div className="relative h-48 bg-gradient-to-br from-muran-primary/10 to-muran-primary/5">
                  {ad.creative.thumbnail ? (
                    <img 
                      src={ad.creative.thumbnail} 
                      alt={ad.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center p-4">
                        <Target className="h-12 w-12 text-muran-primary mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Preview não disponível
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Platform Badge */}
                  <div className="absolute bottom-2 left-2">
                    <Badge variant="secondary" className="backdrop-blur-sm">
                      {ad.platform === 'meta' ? 'Meta Ads' : 'Google Ads'}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-4 space-y-3">
                  {/* Ad Name */}
                  <h3 className="font-semibold line-clamp-2 min-h-[3rem]" title={ad.name}>
                    {ad.name}
                  </h3>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <TrendingUp className="h-3 w-3" />
                        <span>Impressões</span>
                      </div>
                      <div className="font-semibold">{formatNumber(ad.metrics.impressions)}</div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MousePointerClick className="h-3 w-3" />
                        <span>CTR</span>
                      </div>
                      <div className="font-semibold text-blue-600">{ad.metrics.ctr.toFixed(2)}%</div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Target className="h-3 w-3" />
                        <span>Conversões</span>
                      </div>
                      <div className="font-semibold text-green-600">{formatNumber(ad.metrics.conversions)}</div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <DollarSign className="h-3 w-3" />
                        <span>CPA</span>
                      </div>
                      <div className="font-semibold text-muran-primary">{formatCurrency(ad.metrics.cpa)}</div>
                    </div>
                  </div>

                  {/* Investment */}
                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Investimento Total</span>
                      <span className="font-bold text-muran-primary">{formatCurrency(ad.metrics.spend)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {sortedAds.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum criativo disponível para o período selecionado</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
