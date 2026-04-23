import { PremiumBlockRenderer } from '../registry';

export const DividerBlock: PremiumBlockRenderer = ({ block }) => {
  const accent = block.config.accent || '#ffffff';
  return (
    <div className="h-full w-full flex items-center">
      <div
        className="h-px w-full"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}25, transparent)` }}
      />
    </div>
  );
};
