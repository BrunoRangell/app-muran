
import { Badge } from "@/components/ui/badge";
import { CampaignStatus } from "./types";

interface HealthStatusIndicatorProps {
  status: CampaignStatus;
}

export function HealthStatusIndicator({ status }: HealthStatusIndicatorProps) {
  const getStatusConfig = (status: CampaignStatus) => {
    switch (status) {
      case "active":
      case "healthy":
        return {
          label: "Ativo",
          variant: "default" as const,
          className: "bg-green-500 hover:bg-green-600 text-white"
        };
      case "no-spend":
        return {
          label: "Sem Gasto",
          variant: "destructive" as const,
          className: "bg-red-500 hover:bg-red-600 text-white"
        };
      case "no-campaigns":
        return {
          label: "Sem Campanhas",
          variant: "secondary" as const,
          className: "bg-yellow-500 hover:bg-yellow-600 text-white"
        };
      case "no-account":
        return {
          label: "Sem Conta",
          variant: "outline" as const,
          className: "border-gray-400 text-gray-600"
        };
      case "low-performance":
      case "warning":
        return {
          label: "Baixa Performance",
          variant: "secondary" as const,
          className: "bg-orange-500 hover:bg-orange-600 text-white"
        };
      case "critical":
        return {
          label: "Crítico",
          variant: "destructive" as const,
          className: "bg-red-600 hover:bg-red-700 text-white"
        };
      case "no-data":
        return {
          label: "Sem Dados",
          variant: "outline" as const,
          className: "border-blue-400 text-blue-600"
        };
      default:
        return {
          label: "Desconhecido",
          variant: "outline" as const,
          className: "border-gray-400 text-gray-600"
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge 
      variant={config.variant}
      className={config.className}
    >
      {config.label}
    </Badge>
  );
}
