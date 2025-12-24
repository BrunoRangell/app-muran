import React from 'react';
import { Image as ImageIcon, TrendingUp, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { MetricKey, METRIC_LABELS } from '@/types/template-editor';

interface Creative {
  id: string;
  name: string;
  thumbnail?: string | null;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  ctr: number;
  cpa?: number;
  cpc?: number;
  platform?: string;
}

interface TopCreativesWidgetProps {
  creatives: Creative[];
  metrics?: MetricKey[];
  limit?: number;
  title?: string;
}

// Formatar valor baseado no tipo de métrica
const formatValue = (key: MetricKey, value: number | undefined): string => {
  if (value === undefined || value === null) return '-';
  
  switch (key) {
    case 'impressions':
    case 'clicks':
    case 'conversions':
      return value.toLocaleString('pt-BR');
    case 'spend':
      return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    case 'ctr':
      return `${value.toFixed(1)}%`;
    case 'cpa':
    case 'cpc':
      return `R$ ${value.toFixed(2)}`;
    default:
      return value.toString();
  }
};

export function TopCreativesWidget({ 
  creatives, 
  metrics = ['clicks', 'ctr'],
  limit = 5,
  title 
}: TopCreativesWidgetProps) {
  const displayCreatives = creatives?.slice(0, limit) || [];
  
  // Usar no máximo 2 métricas para exibição compacta
  const displayMetrics = metrics.slice(0, 2);

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
                  {displayMetrics.map((metric, idx) => {
                    const value = creative[metric as keyof Creative] as number;
                    const isPercentage = metric === 'ctr';
                    
                    return (
                      <span 
                        key={metric}
                        className={cn(
                          idx === 0 ? "text-muted-foreground" : "flex items-center gap-0.5 text-green-600"
                        )}
                      >
                        {idx === 1 && isPercentage && <TrendingUp className="w-3 h-3" />}
                        {formatValue(metric, value)}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
