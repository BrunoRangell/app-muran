
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, AlertCircle, Minus } from "lucide-react";

interface StatusIndicatorProps {
  status: "healthy" | "warning" | "error" | "no-data";
}

export function StatusIndicator({ status }: StatusIndicatorProps) {
  const statusConfig = {
    healthy: {
      label: "Saudável",
      variant: "default" as const,
      color: "text-green-600 bg-green-50 border-green-200",
      icon: CheckCircle,
    },
    warning: {
      label: "Atenção",
      variant: "secondary" as const,
      color: "text-amber-600 bg-amber-50 border-amber-200",
      icon: AlertCircle,
    },
    error: {
      label: "Problema",
      variant: "destructive" as const,
      color: "text-red-600 bg-red-50 border-red-200",
      icon: AlertTriangle,
    },
    "no-data": {
      label: "Sem dados",
      variant: "outline" as const,
      color: "text-gray-500 bg-gray-50 border-gray-200",
      icon: Minus,
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant} 
      className={`flex items-center gap-1 text-xs ${config.color}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
