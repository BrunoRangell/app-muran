import { Card } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Eye, MousePointer, Target, TrendingUp, DollarSign, Calculator, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { MetricKey, METRIC_LABELS } from "@/types/template-editor";
import React from "react";

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

// Formato para cada métrica
const METRIC_FORMAT: Record<MetricKey, 'number' | 'currency' | 'percentage'> = {
  impressions: 'number',
  reach: 'number',
  clicks: 'number',
  ctr: 'percentage',
  conversions: 'number',
  spend: 'currency',
  cpa: 'currency',
  cpc: 'currency'
};

interface MetricCardWidgetProps {
  metric: MetricKey;
  data: {
    current: number;
    previous: number;
    change: number;
  };
  showComparison?: boolean;
  title?: string;
}

export function MetricCardWidget({ 
  metric, 
  data, 
  showComparison = true,
  title 
}: MetricCardWidgetProps) {
  const format = METRIC_FORMAT[metric];
  const icon = METRIC_ICONS[metric];
  const label = title || METRIC_LABELS[metric];

  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
      case 'percentage':
        return `${val.toFixed(2)}%`;
      default:
        return new Intl.NumberFormat('pt-BR').format(val);
    }
  };

  const isPositive = data.change > 0;
  const isNegative = data.change < 0;

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
          {showComparison && data.change !== 0 && (
            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold",
              isPositive && "bg-green-500/10 text-green-600 dark:text-green-400",
              isNegative && "bg-red-500/10 text-red-600 dark:text-red-400"
            )}>
              {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {Math.abs(data.change).toFixed(1)}%
            </div>
          )}
        </div>
        
        <div>
          <p className="text-sm text-muted-foreground font-medium mb-1">{label}</p>
          <p className="text-xl font-bold tracking-tight">
            {formatValue(data.current)}
          </p>
          {showComparison && data.previous > 0 && (
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
              <span className="opacity-60">Anterior:</span>
              <span className="font-medium">{formatValue(data.previous)}</span>
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
