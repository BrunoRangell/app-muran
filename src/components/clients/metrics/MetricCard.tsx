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
}: MetricCardProps) => {};