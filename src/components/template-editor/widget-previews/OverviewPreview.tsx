import React from 'react';
import { MetricKey, METRIC_LABELS } from '@/types/template-editor';
import { mockOverview, formatMetricValue } from '@/data/mockPreviewData';
import { TrendingUp, TrendingDown, Eye, MousePointer, Target, DollarSign, Calculator, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

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

// Ícones para cada métrica
const METRIC_ICONS: Record<MetricKey, React.ReactNode> = {
  impressions: <Eye className="h-4 w-4 text-muran-primary" />,
  reach: <Zap className="h-4 w-4 text-muran-primary" />,
  clicks: <MousePointer className="h-4 w-4 text-muran-primary" />,
  ctr: <Calculator className="h-4 w-4 text-muran-primary" />,
  conversions: <Target className="h-4 w-4 text-muran-primary" />,
  spend: <DollarSign className="h-4 w-4 text-muran-primary" />,
  cpa: <Calculator className="h-4 w-4 text-muran-primary" />,
  cpc: <Calculator className="h-4 w-4 text-muran-primary" />
};

export function OverviewPreview() {
  return (
    <div className="h-full w-full p-3 overflow-auto">
      <div className="grid grid-cols-4 gap-3">
        {OVERVIEW_METRICS.map((metric) => {
          const value = mockOverview[metric];
          const change = MOCK_CHANGES[metric];
          const icon = METRIC_ICONS[metric];
          
          return (
            <Card 
              key={metric}
              className="glass-card group relative overflow-hidden p-3 transition-all duration-300 hover:shadow-lg hover:shadow-muran-primary/10"
            >
              {/* Gradient accent line */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-muran-primary to-muran-primary/60 opacity-80" />
              
              <div className="relative space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-1.5 bg-gradient-to-br from-muran-primary/20 to-muran-primary/10 rounded-lg border border-muran-primary/20">
                    {icon}
                  </div>
                  <div className={cn(
                    "flex items-center gap-0.5 text-xs font-semibold",
                    change.positive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                  )}>
                    {change.positive ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {change.value}%
                  </div>
                </div>
                
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">{METRIC_LABELS[metric]}</p>
                  <p className="text-base font-bold tracking-tight">
                    {formatMetricValue(metric, value)}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
