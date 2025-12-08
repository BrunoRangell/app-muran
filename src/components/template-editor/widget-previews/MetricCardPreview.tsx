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

export function MetricCardPreview({ metric, showComparison = true, compact = false }: MetricCardPreviewProps) {
  const value = mockOverview[metric];
  const formattedValue = formatMetricValue(metric, value);
  const label = METRIC_LABELS[metric];
  const color = METRIC_COLORS[metric];
  const change = MOCK_CHANGES[metric];

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
            change.positive 
              ? "bg-green-500/10 text-green-600" 
              : "bg-red-500/10 text-red-600"
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
    </div>
  );
}
