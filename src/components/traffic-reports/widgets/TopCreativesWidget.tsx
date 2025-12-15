import React from 'react';
import { Image as ImageIcon, TrendingUp, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Creative {
  id: string;
  name: string;
  thumbnail?: string | null;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  ctr: number;
  platform?: string;
}

interface TopCreativesWidgetProps {
  creatives: Creative[];
  limit?: number;
  title?: string;
}

export function TopCreativesWidget({ 
  creatives, 
  limit = 5,
  title 
}: TopCreativesWidgetProps) {
  const displayCreatives = creatives?.slice(0, limit) || [];

  if (displayCreatives.length === 0) {
    return (
      <Card className="glass-card h-full w-full flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Sem dados de criativos</p>
      </Card>
    );
  }

  return (
    <Card className="glass-card h-full w-full overflow-hidden">
      {title && (
        <div className="px-4 py-3 border-b border-border/50">
          <h3 className="text-sm font-medium">{title}</h3>
        </div>
      )}
      <div className="h-full w-full p-3 overflow-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {displayCreatives.map((creative, index) => (
            <div 
              key={creative.id}
              className="flex flex-col rounded-lg border border-border/50 bg-gradient-to-br from-background to-muted/30 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Thumbnail */}
              <div className="aspect-square bg-muted/50 flex items-center justify-center relative">
                {creative.thumbnail ? (
                  <img 
                    src={creative.thumbnail} 
                    alt={creative.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
                )}
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
                <p className="text-xs font-medium truncate mb-1" title={creative.name}>
                  {creative.name}
                </p>
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
    </Card>
  );
}
