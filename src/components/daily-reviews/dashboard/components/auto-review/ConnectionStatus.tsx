
import { CheckCircle2, XCircle, Clock } from "lucide-react";

interface ConnectionStatusProps {
  lastConnectionStatus: "success" | "error" | null;
}

export function ConnectionStatus({ lastConnectionStatus }: ConnectionStatusProps) {
  if (!lastConnectionStatus) {
    return (
      <div className="text-gray-500 flex items-center">
        <Clock className="h-4 w-4 mr-2" />
        <span>Status desconhecido</span>
      </div>
    );
  }

  if (lastConnectionStatus === "success") {
    return (
      <div className="text-green-600 flex items-center">
        <CheckCircle2 className="h-4 w-4 mr-2" />
        <span>Conectado e funcionando</span>
      </div>
    );
  }

  return (
    <div className="text-red-600 flex items-center">
      <XCircle className="h-4 w-4 mr-2" />
      <span>Problema de conexão detectado</span>
    </div>
  );
}
