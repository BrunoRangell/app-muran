
import { CheckCircle2, AlertCircle, AlertTriangle, Activity } from "lucide-react";

type Status = "ok" | "warning" | "error" | "nodata";

export function HealthStatusIndicator({ status }: { status: Status }) {
  const options = {
    ok: {
      icon: <CheckCircle2 className="text-emerald-500 w-4 h-4" />,
      label: "Normal"
    },
    warning: {
      icon: <AlertTriangle className="text-yellow-500 w-4 h-4" />,
      label: "Atenção"
    },
    error: {
      icon: <AlertCircle className="text-destructive w-4 h-4" />,
      label: "Erro"
    },
    nodata: {
      icon: <Activity className="text-gray-400 w-4 h-4" />,
      label: "Sem Dados"
    }
  };

  return (
    <div className="flex items-center gap-1">
      {options[status].icon}
      <span className="text-xs hidden sm:inline">{options[status].label}</span>
    </div>
  );
}
