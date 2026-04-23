import { Lightbulb } from 'lucide-react';
import { PremiumBlockRenderer } from '../registry';

export const InsightBlock: PremiumBlockRenderer = ({ block }) => {
  const { title, text, accent = '#ff6e00', variant = 'subtle' } = block.config;
  const isBold = variant === 'bold' || variant === 'glow';

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/[0.06] p-5 h-full"
      style={{
        background: isBold
          ? `linear-gradient(135deg, ${accent}25, ${accent}05)`
          : 'linear-gradient(135deg, rgba(255,255,255,0.03), transparent)',
        boxShadow: variant === 'glow' ? `0 0 40px -10px ${accent}40` : undefined,
      }}
    >
      <div className="flex items-start gap-3 h-full">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10"
          style={{ background: `linear-gradient(135deg, ${accent}30, ${accent}10)` }}
        >
          <Lightbulb className="h-4 w-4" style={{ color: accent }} />
        </div>
        <div className="flex-1 min-w-0">
          {title && <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>}
          {text && <p className="text-sm text-white/60 leading-relaxed">{text}</p>}
        </div>
      </div>
    </div>
  );
};
