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
}: MetricCardProps) => (
  <Card className="p-6">
    <div className="flex items-center space-x-4">
      <div className="p-3 bg-muran-primary/10 rounded-full">
        <Icon className="h-6 w-6 text-muran-primary" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs p-4">
                <p className="text-sm">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <h3 className="text-2xl font-bold text-muran-dark">
          {formatter(value || 0)}
        </h3>
      </div>
    </div>
  </Card>
);