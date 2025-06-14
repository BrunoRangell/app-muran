
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowUp, ArrowDown, Info } from "lucide-react";

interface UnifiedMetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  color?: string;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'compact' | 'detailed';
}

export function UnifiedMetricCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  color = "text-muran-primary",
  onClick,
  className = "",
  variant = 'default'
}: UnifiedMetricCardProps) {
  const cardClasses = `
    ${onClick ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200' : ''}
    ${className}
  `;

  const renderTrend = () => {
    if (!trend) return null;

    const TrendIcon = trend.isPositive ? ArrowUp : ArrowDown;
    const trendColor = trend.isPositive ? 'text-green-600' : 'text-red-600';

    return (
      <div className={`flex items-center gap-1 text-xs ${trendColor}`}>
        <TrendIcon className="h-3 w-3" />
        <span>{Math.abs(trend.value)}%</span>
        {trend.label && <span className="text-gray-500">{trend.label}</span>}
      </div>
    );
  };

  if (variant === 'compact') {
    return (
      <Card className={cardClasses} onClick={onClick}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-xl font-bold text-muran-dark">{value}</p>
              {renderTrend()}
            </div>
            <div className={`p-2 rounded-full bg-gray-100`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cardClasses} onClick={onClick}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
          <Icon className={`h-4 w-4 ${color}`} />
          {title}
          {description && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-gray-400 hover:text-gray-600 transition-colors" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs">{description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-2xl font-bold text-muran-dark">{value}</div>
          {renderTrend()}
          {variant === 'detailed' && description && (
            <p className="text-xs text-gray-500">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
