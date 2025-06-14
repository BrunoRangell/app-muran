
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
      className={`p-4 hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 ${
        onClick ? 'hover:scale-[1.02]' : ''
      } group`}
      style={{ borderLeftColor: color.replace('bg-', '#') }}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors">
              {title}
            </h4>
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
          </div>
          
          <div className="mb-2">
            <span className="text-2xl font-bold text-muran-dark group-hover:text-muran-primary transition-colors">
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
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-gray-500">vs mês anterior</span>
            </div>
          )}
        </div>

        <div className={`p-3 rounded-full ${color.replace('bg-', 'bg-')}/10 group-hover:${color.replace('bg-', 'bg-')}/20 transition-colors`}>
          <Icon className={`h-5 w-5 ${color.replace('bg-', 'text-')}`} />
        </div>
      </div>
    </Card>
  );
};
