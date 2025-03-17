
import { createLogger } from "@/lib/logger";

const logger = createLogger("debug-info");

interface DebugInfoProps {
  debugInfo: any;
  rawApiResponse: any;
}

export function DebugInfo({ debugInfo, rawApiResponse }: DebugInfoProps) {
  const renderDebugInfo = () => {
    if (!debugInfo) return null;
    
    return (
      <details className="mt-4 p-2 border border-dashed border-[#ff6e00] rounded-md">
        <summary className="text-xs font-mono cursor-pointer text-[#ff6e00] hover:text-[#ff8c33] font-medium">
          Informações de diagnóstico
        </summary>
        <pre className="mt-2 bg-[#ebebf0] p-2 rounded text-xs font-mono overflow-auto max-h-60 text-[#321e32]">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </details>
    );
  };

  const renderRawResponseDebug = () => {
    if (!rawApiResponse) return null;
    
    return (
      <details className="mt-4 p-2 border border-dashed border-[#321e32] rounded-md">
        <summary className="text-xs font-mono cursor-pointer text-[#321e32] hover:text-[#503050] font-medium">
          Resposta bruta da API (para depuração)
        </summary>
        <pre className="mt-2 bg-[#ebebf0] p-2 rounded text-xs font-mono overflow-auto max-h-60 text-[#0f0f0f]">
          {JSON.stringify(rawApiResponse, null, 2)}
        </pre>
      </details>
    );
  };

  return (
    <>
      {renderDebugInfo()}
      {renderRawResponseDebug()}
    </>
  );
}
