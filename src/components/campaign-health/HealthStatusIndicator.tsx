
import { CheckCircle2, AlertCircle, AlertTriangle, Activity } from "lucide-react";

type Status = "ok" | "warning" | "error" | "nodata";

export function HealthStatusIndicator({ status }: { status: Status }) {
  const options = {
    ok: {
      icon: <CheckCircle2 className="text-emerald-500" />,
      label: "Normal"
    },
    warning: {
      icon: <AlertTriangle className="text-yellow-500" />,
      label: "Atenção"
    },
    error: {
      icon: <AlertCircle className="text-destructive" />,
      label: "Erro"
    },
    nodata: {
      icon: <Activity className="text-gray-400" />,
      label: "Sem Dados"
    }
  };

  return (
    <div className="flex items-center gap-1">
      {options[status].icon}
      <span className="text-xs">{options[status].label}</span>
    </div>
  );
}
