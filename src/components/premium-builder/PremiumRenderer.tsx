// Renderer único — usado tanto no editor (preview ao vivo) quanto no portal final.
// Toda a renderização premium-v2 passa por aqui.

import { useMemo } from 'react';
import { PremiumBlock, PremiumTemplateV2, PREMIUM_GRID } from '@/types/premium-v2';
import { getPremiumBlockDefinition } from './registry';
import { PremiumDataContext } from './renderer/types';
import { SidebarNav } from '../traffic-reports/premium-templates/dashcortex/SidebarNav';

interface PremiumRendererProps {
  template: PremiumTemplateV2;
  data: PremiumDataContext;
  // Se true, ignora sidebar e padding externo (usado dentro de portal já com layout)
  embedded?: boolean;
  // Permite que o editor desenhe um overlay por bloco (seleção, drag, etc)
  blockWrapper?: (block: PremiumBlock, content: React.ReactNode) => React.ReactNode;
}

export function PremiumRenderer({ template, data, embedded = false, blockWrapper }: PremiumRendererProps) {
  const { cols, rowHeight, marginX, marginY } = PREMIUM_GRID;

  const containerHeight = useMemo(() => {
    const maxY = Math.max(0, ...template.blocks.map((b) => b.layout.y + b.layout.h));
    return maxY * (rowHeight + marginY) + marginY * 2;
  }, [template.blocks, rowHeight, marginY]);

  const renderBlock = (block: PremiumBlock) => {
    const def = getPremiumBlockDefinition(block.type);
    if (!def) {
      return (
        <div className="h-full w-full flex items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
          <p className="text-xs text-white/40">Bloco desconhecido: {block.type}</p>
        </div>
      );
    }
    const Renderer = def.renderer;
    return <Renderer block={block} data={data} />;
  };

  const grid = (
    <div className="relative w-full" style={{ minHeight: containerHeight }}>
      {template.blocks.map((block) => {
        const colWidth = 100 / cols;
        const style: React.CSSProperties = {
          position: 'absolute',
          left: `calc(${block.layout.x * colWidth}% + ${marginX / 2}px)`,
          top: block.layout.y * (rowHeight + marginY) + marginY,
          width: `calc(${block.layout.w * colWidth}% - ${marginX}px)`,
          height: block.layout.h * rowHeight + (block.layout.h - 1) * marginY,
        };
        const content = renderBlock(block);
        return (
          <div key={block.id} style={style} className="overflow-hidden">
            {blockWrapper ? blockWrapper(block, content) : content}
          </div>
        );
      })}
    </div>
  );

  if (embedded) {
    return (
      <div className="dashcortex-root w-full" style={{ background: '#0B0F1A' }}>
        <style>{`
          .dashcortex-root { font-family: 'Space Grotesk', -apple-system, sans-serif; }
        `}</style>
        {grid}
      </div>
    );
  }

  return (
    <div
      className="dashcortex-root w-full min-h-screen px-4 sm:px-6 lg:px-8 py-6"
      style={{ background: '#0B0F1A' }}
    >
      <style>{`
        .dashcortex-root { font-family: 'Space Grotesk', -apple-system, sans-serif; }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="flex gap-6 max-w-[1600px] mx-auto">
        {template.showSidebar && <SidebarNav active="overview" />}
        <div className="flex-1 min-w-0">{grid}</div>
      </div>
    </div>
  );
}
