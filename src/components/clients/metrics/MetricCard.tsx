import { Card } from "@/components/ui/card";
import { Info, TrendingUp, TrendingDown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  icon: any;
  title: string;
  value: number;
  tooltip: string;
  trend?: number;
  inverseTrend?: boolean;
  currency?: boolean;
  formatValue?: (value: number) => string;
  className?: string;
}

export const MetricCard = ({ 
  icon: Icon, 
  title, 
  value, 
  tooltip,
  trend,
  inverseTrend = false,
  currency = false,
  formatValue = (v: number) => v.toString(),
  className
}: MetricCardProps) => {
  const trendColor = (trend && ((trend > 0 && !inverseTrend) || (trend < 0 && inverseTrend))) 
    ? "text-green-400" 
    : "text-red-400";

  return (
    <Card className={cn("p-4 bg-gradient-to-br from-[#160B21] to-[#1A0B2E] border border-[#ff6e00]/20 hover:border-[#ff6e00]/30 transition-colors", className)}>
      <div className="flex items-center justify-between">
        <div className="p-2 bg-[#ff6e00]/10 rounded-lg">
          <Icon className="h-5 w-5 text-[#ff914d]" />
        </div>
        
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${trendColor}`}>
            {trend > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="flex items-center gap-2">
          <h3 className="text-2xl font-bold text-white">
            {currency && "R$ "}
            {formatValue(value)}
          </h3>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-[#ff914d]/70 hover:text-[#ff914d] cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="bg-[#0f0f15] border border-[#ff6e00]/20">
              <p className="text-sm">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <p className="text-sm text-[#ff914d]/80 mt-1">{title}</p>
      </div>
    </Card>
  );
};
