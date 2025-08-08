
import { Card } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LucideIcon } from "lucide-react";

interface InteractiveMetricCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: string;
  description: string;
  onClick?: () => void;
}

export const InteractiveMetricCard = ({
  title,
  value,
  icon: Icon,
  trend,
  color,
  description,
  onClick
}: InteractiveMetricCardProps) => {
  return (
    <Card 
      className={`p-2 hover:shadow-lg transition-all duration-200 cursor-pointer border-l-2 ${
        onClick ? 'hover:scale-[1.01]' : ''
      } group h-fit`}
      style={{ borderLeftColor: color.replace('bg-', '#') }}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-1">
            <h4 className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors truncate">
              {title}
            </h4>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground/60 hover:text-muted-foreground transition-colors flex-shrink-0" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs">{description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="mb-1">
            <span className="text-lg font-bold text-foreground group-hover:text-muran-primary transition-colors">
              {value}
            </span>
          </div>

          {trend && (
            <div className={`flex items-center gap-1 text-xs ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend.isPositive ? (
                <ArrowUp className="h-3 w-3" />
              ) : (
                <ArrowDown className="h-3 w-3" />
              )}
              <span>{Math.abs(trend.value).toFixed(1)}%</span>
              <span className="text-muted-foreground">vs anterior</span>
            </div>
          )}
        </div>

        <div className={`p-1.5 rounded-full ${color.replace('bg-', 'bg-')}/10 group-hover:${color.replace('bg-', 'bg-')}/20 transition-colors flex-shrink-0`}>
          <Icon className={`h-3.5 w-3.5 ${color.replace('bg-', 'text-')}`} />
        </div>
      </div>
    </Card>
  );
};
