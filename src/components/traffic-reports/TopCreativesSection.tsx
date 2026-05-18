import { useMemo, useState } from "react";
import { Sparkles, TrendingUp, Target, MousePointerClick, DollarSign, Facebook, Play, Images } from "lucide-react";
import { formatCurrency, formatNumber } from "@/utils/chartUtils";
import { proxiedImageUrl } from "@/lib/metaImageProxy";
import { MetaVideoPlayerDialog } from "./MetaVideoPlayerDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TopAd {
  id: string;
  name: string;
  platform: 'meta' | 'google';
  creative: {
    thumbnail?: string;
    title?: string;
    body?: string;
    type?: string;
    mediaType?: 'image' | 'video' | 'carousel';
    videoId?: string;
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
  const [failedThumbs, setFailedThumbs] = useState<Record<string, boolean>>({});
  const [playerAd, setPlayerAd] = useState<TopAd | null>(null);

  // Apenas criativos do Meta — Google Ads são majoritariamente texto, sem preview útil
  const metaAds = useMemo(() => topAds.filter(ad => ad.platform === 'meta'), [topAds]);

  const sortedAds = [...metaAds].sort((a, b) => {
    if (sortBy === 'cpa') {
      const av = a.metrics.cpa || Infinity;
      const bv = b.metrics.cpa || Infinity;
      return av - bv;
    }
    return b.metrics[sortBy] - a.metrics[sortBy];
  }).slice(0, limit);

  // Se não houver criativos Meta, não renderiza nada (a seção desaparece)
  if (metaAds.length === 0) {
    return null;
  }

  const getRankBadge = (index: number) => {
    if (index === 0) return "🔥 Top 1";
    if (index === 1) return "⭐ Top 2";
    if (index === 2) return "📈 Top 3";
    return `#${index + 1}`;
  };

  const getBestMetricBadge = (ad: TopAd, allAds: TopAd[]) => {
    const bestCTR = Math.max(...allAds.map(a => a.metrics.ctr));
    const validCpa = allAds.filter(a => a.metrics.cpa > 0).map(a => a.metrics.cpa);
    const bestCPA = validCpa.length ? Math.min(...validCpa) : 0;
    const mostConversions = Math.max(...allAds.map(a => a.metrics.conversions));

    if (ad.metrics.ctr === bestCTR && bestCTR > 0)
      return { label: "Melhor CTR", className: "bg-blue-500/15 text-blue-300 border-blue-500/30" };
    if (ad.metrics.cpa === bestCPA && bestCPA > 0)
      return { label: "Melhor CPA", className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" };
    if (ad.metrics.conversions === mostConversions && mostConversions > 0)
      return { label: "Mais Conversões", className: "bg-[#ff6e00]/15 text-[#ff8c33] border-[#ff6e00]/30" };
    return null;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-white/55">
          {sortedAds.length} anúncios com melhor performance no período
        </p>
        <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
          <SelectTrigger className="w-[200px] bg-white/[0.04] border-white/[0.08] text-white/85 hover:bg-white/[0.07] hover:text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#0B0F1A] border-white/10 text-white">
            <SelectItem value="impressions">Ordenar por Impressões</SelectItem>
            <SelectItem value="ctr">Ordenar por CTR</SelectItem>
            <SelectItem value="conversions">Ordenar por Conversões</SelectItem>
            <SelectItem value="cpa">Ordenar por CPA</SelectItem>
            <SelectItem value="spend">Ordenar por Investimento</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedAds.map((ad, index) => {
          const rankLabel = getRankBadge(index);
          const bestMetric = getBestMetricBadge(ad, sortedAds);
          const proxiedThumb = proxiedImageUrl(ad.creative.thumbnail);
          const hasThumb = proxiedThumb && !failedThumbs[ad.id];
          const mediaType = ad.creative.mediaType || 'image';

          return (
            <div
              key={ad.id}
              className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl transition-all duration-300 hover:border-[#ff6e00]/30 hover:bg-white/[0.04] hover:-translate-y-0.5"
            >
              {/* Rank Badge */}
              <div className="absolute top-3 left-3 z-20">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#ff6e00]/15 text-[#ff8c33] border border-[#ff6e00]/30 backdrop-blur-md">
                  {rankLabel}
                </span>
              </div>

              {/* Best Metric Badge */}
              {bestMetric && (
                <div className="absolute top-3 right-3 z-20">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold border backdrop-blur-md ${bestMetric.className}`}>
                    {bestMetric.label}
                  </span>
                </div>
              )}

              {/* Creative Preview com blur backdrop */}
              {(() => {
                const isPlayableVideo = mediaType === 'video' && !!ad.creative.videoId;
                const PreviewTag = isPlayableVideo ? 'button' : 'div';
                return (
                  <PreviewTag
                    type={isPlayableVideo ? 'button' : undefined}
                    onClick={isPlayableVideo ? () => setPlayerAd(ad) : undefined}
                    className={`relative aspect-video w-full bg-gradient-to-br from-white/[0.03] to-white/[0.01] overflow-hidden block ${
                      isPlayableVideo ? 'cursor-pointer group/play' : ''
                    }`}
                    aria-label={isPlayableVideo ? `Assistir vídeo: ${ad.name}` : undefined}
                  >
                    {hasThumb ? (
                      <>
                        <div className="absolute inset-0 animate-pulse bg-white/[0.03]" />
                        <img
                          src={proxiedThumb}
                          alt=""
                          aria-hidden="true"
                          referrerPolicy="no-referrer"
                          className="absolute inset-0 w-full h-full object-cover scale-110 opacity-50"
                          style={{ filter: "blur(24px)" }}
                        />
                        <div className="absolute inset-0 bg-[#0B0F1A]/40" />
                        <img
                          src={proxiedThumb}
                          alt={ad.name}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          className="relative z-10 w-full h-full object-contain transition-transform duration-300 group-hover/play:scale-[1.02]"
                          onError={() => setFailedThumbs(prev => ({ ...prev, [ad.id]: true }))}
                        />

                        {/* Overlay para vídeo (com hover quando jogável) */}
                        {mediaType === 'video' && (
                          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                            <div
                              className={`rounded-full bg-black/55 backdrop-blur-md border border-white/20 p-3 shadow-lg transition-all duration-300 ${
                                isPlayableVideo
                                  ? 'group-hover/play:scale-110 group-hover/play:bg-[#ff6e00]/80 group-hover/play:border-[#ff6e00]'
                                  : ''
                              }`}
                            >
                              <Play className="h-6 w-6 text-white fill-white" />
                            </div>
                          </div>
                        )}

                        {/* Overlay para carrossel */}
                        {mediaType === 'carousel' && (
                          <div className="absolute bottom-2 right-2 z-20">
                            <span className="inline-flex items-center gap-1 rounded-md bg-black/55 backdrop-blur-md border border-white/15 px-2 py-1 text-[10px] font-medium text-white/90">
                              <Images className="h-3 w-3" /> Carrossel
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#ff6e00]/10 via-transparent to-white/[0.02]">
                        <div className="text-center p-4">
                          {mediaType === 'video' ? (
                            <Play className="h-10 w-10 text-[#ff6e00]/60 mx-auto mb-2" />
                          ) : (
                            <Target className="h-10 w-10 text-[#ff6e00]/60 mx-auto mb-2" />
                          )}
                          <p className="text-xs text-white/50">Preview não disponível</p>
                        </div>
                      </div>
                    )}

                    {/* Platform Badge (sempre Meta nesta seção) */}
                    <div className="absolute bottom-2 left-2 z-20">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 px-2 py-1 text-[10px] font-medium text-white/85">
                        <Facebook className="h-3 w-3 text-[#1877f2]" /> Meta Ads
                      </span>
                    </div>
                  </PreviewTag>
                );
              })()}

              <div className="p-4 space-y-3">
                {/* Ad Name */}
                <h3
                  className="text-sm font-semibold text-white/90 line-clamp-2 min-h-[2.5rem] leading-snug"
                  title={ad.name}
                >
                  {ad.name}
                </h3>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-white/45">
                      <TrendingUp className="h-3 w-3" />
                      <span>Impressões</span>
                    </div>
                    <div className="font-semibold text-white">{formatNumber(ad.metrics.impressions)}</div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-white/45">
                      <MousePointerClick className="h-3 w-3" />
                      <span>CTR</span>
                    </div>
                    <div className="font-semibold text-blue-300">{ad.metrics.ctr.toFixed(2)}%</div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-white/45">
                      <Target className="h-3 w-3" />
                      <span>Conversões</span>
                    </div>
                    <div className="font-semibold text-emerald-300">{formatNumber(ad.metrics.conversions)}</div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-white/45">
                      <DollarSign className="h-3 w-3" />
                      <span>CPA</span>
                    </div>
                    <div className="font-semibold text-[#ff8c33]">{formatCurrency(ad.metrics.cpa)}</div>
                  </div>
                </div>

                {/* Investment */}
                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider text-white/45">Investimento</span>
                  <span className="font-bold text-[#ff6e00]">{formatCurrency(ad.metrics.spend)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {sortedAds.length === 0 && (
        <div className="text-center py-12 text-white/50">
          <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p>Nenhum criativo disponível para o período selecionado</p>
        </div>
      )}
    </div>
  );
}
