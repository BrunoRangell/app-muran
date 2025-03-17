
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface ApiErrorDetailsProps {
  error: {
    name?: string;
    message?: string;
    details?: string;
    stringified?: string;
  };
}

export function ApiErrorDetails({ error }: ApiErrorDetailsProps) {
  if (!error) return null;
  
  return (
    <Alert variant="destructive" className="mt-4 border-[#ff6e00] bg-[#ff6e00]/5">
      <AlertTriangle className="h-4 w-4 text-[#ff6e00]" />
      <AlertTitle className="text-[#ff6e00]">Detalhes técnicos do erro</AlertTitle>
      <AlertDescription>
        <div className="font-mono text-xs mt-2">
          <p>Nome do erro: {error.name || 'Desconhecido'}</p>
          <p>Mensagem: {error.message || 'Nenhuma mensagem disponível'}</p>
          {error.details && (
            <details>
              <summary className="cursor-pointer mt-1">Stack trace</summary>
              <pre className="mt-1 bg-[#321e32] text-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
                {error.details}
              </pre>
            </details>
          )}
          {error.stringified && (
            <details>
              <summary className="cursor-pointer mt-1">Erro completo (JSON)</summary>
              <pre className="mt-1 bg-[#321e32] text-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
                {error.stringified}
              </pre>
            </details>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
