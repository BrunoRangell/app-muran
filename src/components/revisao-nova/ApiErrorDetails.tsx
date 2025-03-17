
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { createLogger } from "@/lib/logger";

const logger = createLogger("api-error");

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
  
  // Registrar o erro no logger
  logger.error("Detalhes do erro da API:", error);
  
  return (
    <Alert variant="destructive" className="mt-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Detalhes técnicos do erro</AlertTitle>
      <AlertDescription>
        <div className="font-mono text-xs mt-2">
          <p>Nome do erro: {error.name || 'Desconhecido'}</p>
          <p>Mensagem: {error.message || 'Nenhuma mensagem disponível'}</p>
          {error.details && (
            <details>
              <summary className="cursor-pointer mt-1">Stack trace</summary>
              <pre className="mt-1 bg-gray-900 text-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
                {error.details}
              </pre>
            </details>
          )}
          {error.stringified && (
            <details>
              <summary className="cursor-pointer mt-1">Erro completo (JSON)</summary>
              <pre className="mt-1 bg-gray-900 text-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
                {error.stringified}
              </pre>
            </details>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
