
import { CheckCircle2, AlertCircle, AlertTriangle, MinusCircle } from "lucide-react";
import { CampaignStatus } from "./types";

interface CompactStatusIndicatorProps {
  status: CampaignStatus;
}

export function CompactStatusIndicator({ status }: CompactStatusIndicatorProps) {
  const statusConfig = {
    funcionando: {
      icon: <CheckCircle2 className="w-4 h-4" />,
      label: "Funcionando",
      className: "text-green-600 bg-green-50 border-green-200"
    },
    "sem-veiculacao": {
      icon: <AlertCircle className="w-4 h-4" />,
      label: "Sem veiculação",
      className: "text-red-600 bg-red-50 border-red-200"
    },
    "sem-campanhas": {
      icon: <AlertTriangle className="w-4 h-4" />,
      label: "Sem campanhas",
      className: "text-yellow-600 bg-yellow-50 border-yellow-200"
    },
    "nao-configurado": {
      icon: <MinusCircle className="w-4 h-4" />,
      label: "Não configurado",
      className: "text-gray-500 bg-gray-50 border-gray-200"
    }
  };

  const config = statusConfig[status];

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${config.className}`}>
      {config.icon}
      <span className="hidden sm:inline">{config.label}</span>
    </div>
  );
}
