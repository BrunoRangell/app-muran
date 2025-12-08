import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { MetricKey, METRIC_LABELS } from '@/types/template-editor';
import { mockOverview, formatMetricValue, METRIC_COLORS } from '@/data/mockPreviewData';
import { cn } from '@/lib/utils';

interface MetricCardPreviewProps {
  metric: MetricKey;
  showComparison?: boolean;
  compact?: boolean;
}

export function MetricCardPreview({ metric, showComparison = true, compact = false }: MetricCardPreviewProps) {
  const value = mockOverview[metric];
  const formattedValue = formatMetricValue(metric, value);
  const label = METRIC_LABELS[metric];
  const color = METRIC_COLORS[metric];
  
  // Variação fictícia (positiva ou negativa aleatória baseada na métrica)
  const isPositiveMetric = !['cpa', 'cpc', 'spend'].includes(metric);
  const changePercent = metric === 'ctr' ? 12.5 : metric === 'conversions' ? 18.3 : 8.7;
  const isPositiveChange = isPositiveMetric;

  if (compact) {
    return (
      <div className="flex items-center justify-between p-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm font-semibold">{formattedValue}</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col justify-center p-4 rounded-lg bg-gradient-to-br from-background to-muted/30">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <p className="text-2xl font-bold" style={{ color }}>
            {formattedValue}
          </p>
        </div>
        {showComparison && (
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
            isPositiveChange 
              ? "bg-green-500/10 text-green-600" 
              : "bg-red-500/10 text-red-600"
          )}>
            {isPositiveChange ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {changePercent}%
          </div>
        )}
      </div>
    </div>
  );
}
