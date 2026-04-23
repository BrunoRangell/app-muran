import { PremiumBlockRenderer } from '../registry';
import { cn } from '@/lib/utils';

export const HeadingBlock: PremiumBlockRenderer = ({ block }) => {
  const { eyebrow, title, accent = '#ff6e00', align = 'left' } = block.config;
  return (
    <div
      className={cn(
        'h-full w-full flex flex-col justify-center',
        align === 'center' && 'items-center text-center',
        align === 'right' && 'items-end text-right',
      )}
    >
      {eyebrow && (
        <p className="text-[10px] font-bold tracking-[0.25em] uppercase mb-1" style={{ color: accent }}>
          {eyebrow}
        </p>
      )}
      <h2 className="text-xl font-bold text-white tracking-tight">{title || 'Seção'}</h2>
    </div>
  );
};
