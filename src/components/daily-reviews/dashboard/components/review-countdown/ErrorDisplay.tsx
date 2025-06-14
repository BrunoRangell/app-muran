
import { AlertTriangle, Info } from "lucide-react";

interface ErrorDisplayProps {
  errorDetails: string | null;
  lastRunTime: Date | null;
  onOpenErrorDetails: () => void;
  onResetConnectionStatus: () => void;
}

export function ErrorDisplay({ errorDetails, lastRunTime, onOpenErrorDetails, onResetConnectionStatus }: ErrorDisplayProps) {
  return (
    <>
      <div className="text-[10px] text-red-500 flex items-center mt-1 gap-1">
        <div className="flex items-center cursor-help">
          <AlertTriangle className="h-3 w-3" />
          <span>Problema de conexão detectado</span>
        </div>
        
        <button 
          onClick={onOpenErrorDetails}
          className="text-[10px] text-blue-500 hover:text-blue-700 underline ml-auto"
        >
          Detalhes
        </button>
        
        <button 
          onClick={onResetConnectionStatus}
          className="text-[10px] text-blue-500 hover:text-blue-700 underline"
        >
          Resetar
        </button>
      </div>
      
      {errorDetails && (
        <div className="text-[10px] bg-red-50 border border-red-200 p-1 rounded mt-1">
          <div className="flex items-center">
            <Info className="h-3 w-3 text-red-500 mr-1" />
            <span className="font-semibold text-red-600">Detalhes do erro:</span>
          </div>
          <p className="text-red-600 mt-0.5 break-all">{errorDetails}</p>
        </div>
      )}
      
      {lastRunTime && (
        <div className="text-[10px] text-gray-500 mt-1">
          Última execução: {lastRunTime.toLocaleTimeString()}
        </div>
      )}
    </>
  );
}
