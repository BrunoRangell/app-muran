
import { Card } from "@/components/ui/card";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MetricCardProps {
  icon: any;
  title: string;
  value: number;
  tooltip: string;
  formatter?: (value: number) => string;
}

export const MetricCard = ({
  icon: Icon,
  title,
  value,
  tooltip,
  formatter = (v: number) => v.toString()
}: MetricCardProps) => {
  return (
    <Card className="p-6 hover:shadow-lg transition-all duration-200 border-l-4 border-l-muran-primary">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-sm font-medium text-gray-600">
              {title}
            </h4>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="mb-1">
            <span className="text-2xl font-bold text-muran-dark">
              {formatter(value)}
            </span>
          </div>
        </div>

        <div className="p-3 rounded-full bg-muran-primary/10">
          <Icon className="h-6 w-6 text-muran-primary" />
        </div>
      </div>
    </Card>
  );
};
