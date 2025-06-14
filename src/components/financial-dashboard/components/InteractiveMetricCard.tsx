
import { UnifiedMetricCard } from "@/components/common/UnifiedMetricCard";
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
  icon,
  trend,
  color,
  description,
  onClick
}: InteractiveMetricCardProps) => {
  return (
    <UnifiedMetricCard
      title={title}
      value={value}
      icon={icon}
      description={description}
      trend={trend ? { ...trend, label: "vs mês anterior" } : undefined}
      color={color.replace('bg-', 'text-')}
      onClick={onClick}
      variant="detailed"
    />
  );
};
