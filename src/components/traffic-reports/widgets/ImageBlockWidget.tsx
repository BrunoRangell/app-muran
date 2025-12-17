import React from 'react';
import { cn } from '@/lib/utils';
import { ImageIcon } from 'lucide-react';

interface ImageBlockWidgetProps {
  imageUrl?: string;
  imageAlt?: string;
  objectFit?: 'cover' | 'contain' | 'fill';
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const borderRadiusClasses = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full'
};

const objectFitClasses = {
  cover: 'object-cover',
  contain: 'object-contain',
  fill: 'object-fill'
};

export function ImageBlockWidget({
  imageUrl,
  imageAlt = 'Imagem',
  objectFit = 'contain',
  borderRadius = 'md'
}: ImageBlockWidgetProps) {
  if (!imageUrl) {
    return (
      <div className={cn(
        "h-full w-full flex flex-col items-center justify-center",
        "bg-muted/30 border-2 border-dashed border-border",
        borderRadiusClasses[borderRadius]
      )}>
        <ImageIcon className="w-10 h-10 text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">URL da imagem não definida</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Configure nas propriedades</p>
      </div>
    );
  }

  return (
    <div className={cn(
      "h-full w-full overflow-hidden",
      borderRadiusClasses[borderRadius]
    )}>
      <img
        src={imageUrl}
        alt={imageAlt}
        className={cn(
          "h-full w-full",
          objectFitClasses[objectFit]
        )}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          target.parentElement?.classList.add('flex', 'items-center', 'justify-center', 'bg-muted/30');
          const errorDiv = document.createElement('div');
          errorDiv.className = 'text-center';
          errorDiv.innerHTML = '<p class="text-sm text-destructive">Erro ao carregar imagem</p>';
          target.parentElement?.appendChild(errorDiv);
        }}
      />
    </div>
  );
}
