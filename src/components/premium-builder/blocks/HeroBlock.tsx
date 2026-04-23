import { PremiumBlockRenderer } from '../registry';
import { cn } from '@/lib/utils';

export const HeroBlock: PremiumBlockRenderer = ({ block, data }) => {
  const { eyebrow, title, subtitle, accent = '#ff6e00', align = 'left' } = block.config;
  const clientName = data.clientName;
  const periodLabel = data.dateRange
    ? `${new Date(data.dateRange.start).toLocaleDateString('pt-BR')} — ${new Date(data.dateRange.end).toLocaleDateString('pt-BR')}`
    : '';

  return (
    <div
      className={cn(
        'h-full w-full flex flex-col justify-center',
        align === 'center' && 'items-center text-center',
        align === 'right' && 'items-end text-right',
      )}
    >
      {eyebrow && (
        <p
          className="text-[11px] font-bold tracking-[0.25em] uppercase mb-2"
          style={{ color: accent }}
        >
          {eyebrow}
        </p>
      )}
      <h1 className="text-3xl font-bold text-white tracking-tight">
        {title || 'Overview'}
        {clientName && (
          <span className="text-white/50 font-normal"> · {clientName}</span>
        )}
      </h1>
      {(subtitle || periodLabel) && (
        <p className="text-sm text-white/40 mt-1">
          {subtitle || periodLabel}
        </p>
      )}
    </div>
  );
};
