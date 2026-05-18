import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useMetaVideoSource } from "@/lib/metaVideoSource";
import { ExternalLink, Loader2, AlertCircle, Facebook } from "lucide-react";
import { formatCurrency, formatNumber } from "@/utils/chartUtils";

interface MetaVideoPlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId?: string;
  poster?: string;
  permalinkUrl?: string;
  ad: {
    name: string;
    metrics: {
      impressions: number;
      spend: number;
      ctr: number;
    };
  } | null;
}

export function MetaVideoPlayerDialog({
  open,
  onOpenChange,
  videoId,
  poster,
  permalinkUrl,
  ad,
}: MetaVideoPlayerDialogProps) {
  const { data, isLoading, error } = useMetaVideoSource(videoId, open && !!videoId);
  const effectivePermalink = data?.permalink_url || permalinkUrl;
  const hasSource = !!data?.source;
  const showLoading = !!videoId && isLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-[#0B0F1A] border-white/10 text-white">
        <div className="relative bg-black aspect-video flex items-center justify-center">
          {showLoading && (
            <div className="flex flex-col items-center gap-2 text-white/70">
              <Loader2 className="h-8 w-8 animate-spin text-[#ff6e00]" />
              <span className="text-sm">Carregando vídeo…</span>
            </div>
          )}

          {!showLoading && hasSource && (
            <video
              src={data!.source!}
              poster={poster}
              controls
              autoPlay
              playsInline
              className="w-full h-full object-contain bg-black"
            />
          )}

          {!showLoading && !hasSource && (
            <div className="flex flex-col items-center gap-3 text-center px-6 py-10">
              {poster && (
                <img
                  src={poster}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover opacity-30"
                  style={{ filter: 'blur(12px)' }}
                />
              )}
              <AlertCircle className="relative h-10 w-10 text-[#ff6e00]/70" />
              <p className="relative text-sm text-white/80 max-w-md">
                {error
                  ? "Não foi possível carregar o vídeo diretamente. Abra a publicação no Facebook para assistir."
                  : "Este criativo usa uma publicação existente — abra no Facebook para assistir ao vídeo original."}
              </p>
              {effectivePermalink && (
                <a
                  href={effectivePermalink}
                  target="_blank"
                  rel="noreferrer"
                  className="relative inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1877f2]/15 border border-[#1877f2]/30 text-[#4a9bff] hover:bg-[#1877f2]/25 transition-colors text-sm font-medium"
                >
                  <Facebook className="h-4 w-4" />
                  Abrir no Facebook
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          )}
        </div>

        {ad && (
          <div className="p-5 space-y-3">
            <h3 className="text-base font-semibold text-white leading-snug line-clamp-2" title={ad.name}>
              {ad.name}
            </h3>
            <div className="flex items-center gap-4 text-xs text-white/60 flex-wrap">
              <span>
                <span className="text-white/40">Impressões: </span>
                <span className="text-white/85 font-medium tabular-nums">
                  {formatNumber(ad.metrics.impressions)}
                </span>
              </span>
              <span>
                <span className="text-white/40">CTR: </span>
                <span className="text-blue-300 font-medium tabular-nums">
                  {ad.metrics.ctr.toFixed(2)}%
                </span>
              </span>
              <span>
                <span className="text-white/40">Investimento: </span>
                <span className="text-[#ff8c33] font-medium tabular-nums">
                  {formatCurrency(ad.metrics.spend)}
                </span>
              </span>
              {effectivePermalink && (
                <a
                  href={effectivePermalink}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto inline-flex items-center gap-1.5 text-white/55 hover:text-white transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Ver no Facebook
                </a>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
