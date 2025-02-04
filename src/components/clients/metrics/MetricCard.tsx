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
  <Card className="p-5 bg-gradient-to-br from-white to-muran-primary/5 hover:shadow-md transition-shadow">
    <div className="flex items-center gap-4">
      <div className="p-3 bg-muran-primary/10 rounded-lg">
        <Icon className="h-6 w-6 text-muran-primary" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-muran-dark/80">{title}</p>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muran-primary/70 hover:text-muran-primary transition-colors" />
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-white border border-muran-primary/20 shadow-lg max-w-xs p-3">
                <p className="text-sm text-muran-dark">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <h3 className="text-2xl font-bold text-muran-dark mt-1">
          {formatter(value || 0)}
        </h3>
      </div>
    </div>
  </Card>
);
