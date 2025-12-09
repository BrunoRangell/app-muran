import React from 'react';
import { MetricKey, METRIC_LABELS } from '@/types/template-editor';
import { mockOverview, formatMetricValue, METRIC_COLORS } from '@/data/mockPreviewData';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const OVERVIEW_METRICS: MetricKey[] = ['impressions', 'reach', 'clicks', 'ctr', 'conversions', 'spend', 'cpa', 'cpc'];

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

export function OverviewPreview() {
  return (
    <div className="h-full w-full p-3 overflow-auto">
      <div className="grid grid-cols-4 gap-3">
        {OVERVIEW_METRICS.map((metric) => {
          const value = mockOverview[metric];
          const change = MOCK_CHANGES[metric];
          const color = METRIC_COLORS[metric];
          
          return (
            <div 
              key={metric}
              className="p-3 rounded-lg bg-gradient-to-br from-background to-muted/30 border border-border/50"
            >
              <p className="text-xs text-muted-foreground mb-1">{METRIC_LABELS[metric]}</p>
              <div className="flex items-end justify-between">
                <p className="text-lg font-bold" style={{ color }}>
                  {formatMetricValue(metric, value)}
                </p>
                <div className={cn(
                  "flex items-center gap-0.5 text-xs font-medium",
                  change.positive ? "text-green-600" : "text-red-600"
                )}>
                  {change.positive ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {change.value}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
