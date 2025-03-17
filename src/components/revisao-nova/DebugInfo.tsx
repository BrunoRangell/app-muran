
interface DebugInfoProps {
  debugInfo: any;
  rawApiResponse: any;
}

export function DebugInfo({ debugInfo, rawApiResponse }: DebugInfoProps) {
  const renderDebugInfo = () => {
    if (!debugInfo) return null;
    
    return (
      <details className="mt-4 p-2 border border-dashed border-blue-300 rounded-md">
        <summary className="text-xs font-mono cursor-pointer text-blue-500">
          Informações de diagnóstico
        </summary>
        <pre className="mt-2 bg-blue-50 p-2 rounded text-xs font-mono overflow-auto max-h-60">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </details>
    );
  };

  const renderRawResponseDebug = () => {
    if (!rawApiResponse) return null;
    
    return (
      <details className="mt-4 p-2 border border-dashed border-gray-300 rounded-md">
        <summary className="text-xs font-mono cursor-pointer text-gray-500">
          Resposta bruta da API (para depuração)
        </summary>
        <pre className="mt-2 bg-gray-50 p-2 rounded text-xs font-mono overflow-auto max-h-60">
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
