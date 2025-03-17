
interface DebugInfoProps {
  debugInfo: any;
  rawApiResponse: any;
}

export function DebugInfo({ debugInfo, rawApiResponse }: DebugInfoProps) {
  const renderDebugInfo = () => {
    if (!debugInfo) return null;
    
    return (
      <details className="mt-4 p-2 border border-dashed border-[#ff6e00] rounded-md">
        <summary className="text-xs font-mono cursor-pointer text-[#ff6e00]">
          Informações de diagnóstico
        </summary>
        <pre className="mt-2 bg-[#ff6e00]/5 p-2 rounded text-xs font-mono overflow-auto max-h-60">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </details>
    );
  };

  const renderRawResponseDebug = () => {
    if (!rawApiResponse) return null;
    
    return (
      <details className="mt-4 p-2 border border-dashed border-[#321e32] rounded-md">
        <summary className="text-xs font-mono cursor-pointer text-[#321e32]">
          Resposta bruta da API (para depuração)
        </summary>
        <pre className="mt-2 bg-[#321e32]/5 p-2 rounded text-xs font-mono overflow-auto max-h-60">
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
