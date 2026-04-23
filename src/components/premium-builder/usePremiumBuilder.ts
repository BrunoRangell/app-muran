// Hook de estado do Premium Builder — gerencia blocos, seleção, undo/redo simples
import { useCallback, useState } from 'react';
import { PremiumBlock, PremiumBlockType, PremiumTemplateV2 } from '@/types/premium-v2';
import { createPremiumBlock } from './registry';

const EMPTY: PremiumTemplateV2 = {
  engine: 'premium-v2',
  version: 1,
  theme: 'dark',
  showSidebar: true,
  blocks: [],
};

export function usePremiumBuilder() {
  const [template, setTemplate] = useState<PremiumTemplateV2>(EMPTY);
  const [name, setName] = useState('Novo Premium');
  const [isGlobal, setIsGlobal] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const load = useCallback((tpl: PremiumTemplateV2, tplName: string, global: boolean) => {
    setTemplate(tpl);
    setName(tplName);
    setIsGlobal(global);
    setIsDirty(false);
    setSelectedId(null);
  }, []);

  const findFreeY = useCallback(() => {
    if (template.blocks.length === 0) return 0;
    return Math.max(...template.blocks.map((b) => b.layout.y + b.layout.h));
  }, [template.blocks]);

  const addBlock = useCallback((type: PremiumBlockType) => {
    const block = createPremiumBlock(type, { x: 0, y: findFreeY() });
    setTemplate((t) => ({ ...t, blocks: [...t.blocks, block] }));
    setSelectedId(block.id);
    setIsDirty(true);
  }, [findFreeY]);

  const removeBlock = useCallback((id: string) => {
    setTemplate((t) => ({ ...t, blocks: t.blocks.filter((b) => b.id !== id) }));
    setSelectedId((curr) => (curr === id ? null : curr));
    setIsDirty(true);
  }, []);

  const duplicateBlock = useCallback((id: string) => {
    setTemplate((t) => {
      const b = t.blocks.find((x) => x.id === id);
      if (!b) return t;
      const copy: PremiumBlock = {
        ...b,
        id: crypto.randomUUID(),
        layout: { ...b.layout, y: b.layout.y + b.layout.h },
      };
      return { ...t, blocks: [...t.blocks, copy] };
    });
    setIsDirty(true);
  }, []);

  const updateBlockConfig = useCallback((id: string, patch: Partial<PremiumBlock['config']>) => {
    setTemplate((t) => ({
      ...t,
      blocks: t.blocks.map((b) => b.id === id ? { ...b, config: { ...b.config, ...patch } } : b),
    }));
    setIsDirty(true);
  }, []);

  const updateLayout = useCallback((id: string, layout: Partial<PremiumBlock['layout']>) => {
    setTemplate((t) => ({
      ...t,
      blocks: t.blocks.map((b) => b.id === id ? { ...b, layout: { ...b.layout, ...layout } } : b),
    }));
    setIsDirty(true);
  }, []);

  const moveBlock = useCallback((id: string, direction: 'up' | 'down') => {
    setTemplate((t) => {
      const idx = t.blocks.findIndex((b) => b.id === id);
      if (idx < 0) return t;
      const swap = direction === 'up' ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= t.blocks.length) return t;
      // Trocar Y entre os dois
      const a = t.blocks[idx];
      const b = t.blocks[swap];
      const ay = a.layout.y;
      const by = b.layout.y;
      return {
        ...t,
        blocks: t.blocks.map((x) => {
          if (x.id === a.id) return { ...x, layout: { ...x.layout, y: by } };
          if (x.id === b.id) return { ...x, layout: { ...x.layout, y: ay } };
          return x;
        }),
      };
    });
    setIsDirty(true);
  }, []);

  const setShowSidebar = useCallback((show: boolean) => {
    setTemplate((t) => ({ ...t, showSidebar: show }));
    setIsDirty(true);
  }, []);

  const selected = template.blocks.find((b) => b.id === selectedId) || null;

  return {
    template, name, isGlobal, selectedId, selected, isDirty,
    setName, setIsGlobal, setSelectedId, setIsDirty,
    load, addBlock, removeBlock, duplicateBlock, updateBlockConfig, updateLayout,
    moveBlock, setShowSidebar,
  };
}
