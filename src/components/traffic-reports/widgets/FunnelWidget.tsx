import React from 'react';
import { Card } from '@/components/ui/card';
import { MetricKey, METRIC_LABELS } from '@/types/template-editor';
import { cn } from '@/lib/utils';
import { ArrowDown } from 'lucide-react';

interface FunnelStep {
  metric: MetricKey;
  value: number;
}

interface FunnelWidgetProps {
  steps: FunnelStep[];
  showRates?: boolean;
  title?: string;
  colors?: string[];
}

const DEFAULT_COLORS = ['#ff6e00', '#6366f1', '#22c55e', '#8b5cf6'];

export function FunnelWidget({ 
  steps, 
  showRates = true, 
  title,
  colors = DEFAULT_COLORS 
}: FunnelWidgetProps) {
  if (steps.length === 0) {
    return (
      <Card className="glass-card h-full w-full flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Configure as métricas do funil</p>
      </Card>
    );
  }

  const maxValue = Math.max(...steps.map(s => s.value));

  return (
    <Card className="glass-card h-full w-full overflow-hidden">
      {title && (
        <div className="px-4 py-3 border-b border-border/50">
          <h3 className="text-sm font-medium">{title}</h3>
        </div>
      )}
      <div className="p-4 h-full flex flex-col justify-center gap-2">
        {steps.map((step, index) => {
          const widthPercent = (step.value / maxValue) * 100;
          const color = colors[index % colors.length];
          const prevStep = index > 0 ? steps[index - 1] : null;
          const conversionRate = prevStep ? ((step.value / prevStep.value) * 100) : 100;

          return (
            <React.Fragment key={step.metric}>
              {/* Conversion rate arrow */}
              {index > 0 && showRates && (
                <div className="flex items-center justify-center gap-2 py-1">
                  <ArrowDown className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground">
                    {conversionRate.toFixed(1)}%
                  </span>
                </div>
              )}
              
              {/* Funnel bar */}
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <div 
                    className="h-12 rounded-lg transition-all duration-500 flex items-center justify-center relative overflow-hidden"
                    style={{ 
                      width: `${Math.max(widthPercent, 20)}%`,
                      background: `linear-gradient(135deg, ${color}, ${color}dd)`,
                      marginLeft: `${(100 - widthPercent) / 2}%`
                    }}
                  >
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
                    
                    <span className="text-white font-bold text-sm z-10">
                      {step.value.toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
                <div className="w-24 text-right">
                  <span className="text-xs font-medium text-muted-foreground">
                    {METRIC_LABELS[step.metric]}
                  </span>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </Card>
  );
}
