
import { CheckCircle2, AlertCircle, AlertTriangle, MinusCircle } from "lucide-react";
import { CampaignStatus } from "./hooks/useActiveCampaignHealth";

interface StatusIndicatorProps {
  status: CampaignStatus;
  showLabel?: boolean;
}

export function StatusIndicator({ status, showLabel = true }: StatusIndicatorProps) {
  const statusConfig = {
    funcionando: {
      icon: <CheckCircle2 className="w-4 h-4 text-green-500" />,
      label: "Funcionando",
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    "sem-veiculacao": {
      icon: <AlertCircle className="w-4 h-4 text-red-500" />,
      label: "Sem veiculação",
      color: "text-red-600",
      bgColor: "bg-red-50"
    },
    "sem-campanhas": {
      icon: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
      label: "Sem campanhas",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50"
    },
    "nao-configurado": {
      icon: <MinusCircle className="w-4 h-4 text-gray-400" />,
      label: "Não configurado",
      color: "text-gray-500",
      bgColor: "bg-gray-50"
    }
  };

  const config = statusConfig[status];

  return (
    <div className={`flex items-center gap-2 px-2 py-1 rounded-md ${config.bgColor}`}>
      {config.icon}
      {showLabel && (
        <span className={`text-xs font-medium ${config.color}`}>
          {config.label}
        </span>
      )}
    </div>
  );
}
