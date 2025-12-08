import React from 'react';
import { Image as ImageIcon, TrendingUp } from 'lucide-react';
import { mockCreatives } from '@/data/mockPreviewData';
import { cn } from '@/lib/utils';

interface TopCreativesPreviewProps {
  limit?: number;
}

export function TopCreativesPreview({ limit = 5 }: TopCreativesPreviewProps) {
  const creatives = mockCreatives.slice(0, limit);

  return (
    <div className="h-full w-full p-3 overflow-auto">
      <div className="grid grid-cols-5 gap-3">
        {creatives.map((creative, index) => (
          <div 
            key={creative.id}
            className="flex flex-col rounded-lg border border-border/50 bg-gradient-to-br from-background to-muted/30 overflow-hidden"
          >
            {/* Thumbnail placeholder */}
            <div className="aspect-square bg-muted/50 flex items-center justify-center relative">
              <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
              <div className={cn(
                "absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                index === 0 ? "bg-yellow-500 text-yellow-950" :
                index === 1 ? "bg-gray-300 text-gray-700" :
                index === 2 ? "bg-amber-600 text-amber-50" :
                "bg-muted text-muted-foreground"
              )}>
                {index + 1}
              </div>
            </div>
            
            {/* Info */}
            <div className="p-2">
              <p className="text-xs font-medium truncate mb-1">{creative.name}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {creative.clicks.toLocaleString('pt-BR')} cliques
                </span>
                <div className="flex items-center gap-0.5 text-green-600">
                  <TrendingUp className="w-3 h-3" />
                  <span>{creative.ctr.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
