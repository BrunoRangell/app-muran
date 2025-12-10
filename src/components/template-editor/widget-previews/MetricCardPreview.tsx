import React from 'react';
import { TrendingUp, TrendingDown, Eye, MousePointer, Target, DollarSign, Calculator, Zap } from 'lucide-react';
import { MetricKey, METRIC_LABELS } from '@/types/template-editor';
import { mockOverview, formatMetricValue } from '@/data/mockPreviewData';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface MetricCardPreviewProps {
  metric: MetricKey;
  showComparison?: boolean;
  compact?: boolean;
}

// Variações fictícias para cada métrica
const MOCK_CHANGES: Record<MetricKey, { value: number; positive: boolean }> = {
  impressions: { value: 12.5, positive: true },
  reach: { value: 8.3, positive: true },
  clicks: { value: 15.2, positive: true },
  ctr: { value: 3.1, positive: true },
  conversions: { value: 22.4, positive: true },
  spend: { value: 5.8, positive: false },
  cpa: { value: 8.7, positive: true },
  cpc: { value: 4.2, positive: true }
};

// Ícones para cada métrica
const METRIC_ICONS: Record<MetricKey, React.ReactNode> = {
  impressions: <Eye className="h-5 w-5 text-muran-primary" />,
  reach: <Zap className="h-5 w-5 text-muran-primary" />,
  clicks: <MousePointer className="h-5 w-5 text-muran-primary" />,
  ctr: <Calculator className="h-5 w-5 text-muran-primary" />,
  conversions: <Target className="h-5 w-5 text-muran-primary" />,
  spend: <DollarSign className="h-5 w-5 text-muran-primary" />,
  cpa: <Calculator className="h-5 w-5 text-muran-primary" />,
  cpc: <Calculator className="h-5 w-5 text-muran-primary" />
};

export function MetricCardPreview({ metric, showComparison = true, compact = false }: MetricCardPreviewProps) {
  const value = mockOverview[metric];
  const formattedValue = formatMetricValue(metric, value);
  const label = METRIC_LABELS[metric];
  const change = MOCK_CHANGES[metric];
  const icon = METRIC_ICONS[metric];

  if (compact) {
    return (
      <div className="flex items-center justify-between p-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm font-semibold">{formattedValue}</span>
      </div>
    );
  }

  return (
    <Card className="glass-card group relative overflow-hidden p-4 transition-all duration-300 hover:shadow-lg hover:shadow-muran-primary/10 h-full">
      {/* Gradient accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-muran-primary to-muran-primary/60 opacity-80" />
      
      {/* Background glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-muran-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative space-y-3">
        <div className="flex items-center justify-between">
          <div className="p-2 bg-gradient-to-br from-muran-primary/20 to-muran-primary/10 rounded-xl border border-muran-primary/20 shadow-inner">
            {icon}
          </div>
          {showComparison && (
            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold",
              change.positive 
                ? "bg-green-500/10 text-green-600 dark:text-green-400" 
                : "bg-red-500/10 text-red-600 dark:text-red-400"
            )}>
              {change.positive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {change.value}%
            </div>
          )}
        </div>
        
        <div>
          <p className="text-sm text-muted-foreground font-medium mb-1">{label}</p>
          <p className="text-xl font-bold tracking-tight">
            {formattedValue}
          </p>
        </div>
      </div>
    </Card>
  );
}
