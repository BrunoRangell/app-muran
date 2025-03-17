
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
    <Alert variant="destructive" className="mt-4 border-[#ff6e00] bg-[#fff5eb]">
      <AlertTriangle className="h-4 w-4 text-[#ff6e00]" />
      <AlertTitle className="text-[#321e32] font-semibold">Detalhes técnicos do erro</AlertTitle>
      <AlertDescription>
        <div className="font-mono text-xs mt-2 text-[#0f0f0f]">
          <p>Nome do erro: {error.name || 'Desconhecido'}</p>
          <p>Mensagem: {error.message || 'Nenhuma mensagem disponível'}</p>
          {error.details && (
            <details>
              <summary className="cursor-pointer mt-1 text-[#ff6e00] hover:text-[#ff8c33]">Stack trace</summary>
              <pre className="mt-1 bg-[#321e32] text-[#ebebf0] p-2 rounded text-xs overflow-auto max-h-40">
                {error.details}
              </pre>
            </details>
          )}
          {error.stringified && (
            <details>
              <summary className="cursor-pointer mt-1 text-[#ff6e00] hover:text-[#ff8c33]">Erro completo (JSON)</summary>
              <pre className="mt-1 bg-[#321e32] text-[#ebebf0] p-2 rounded text-xs overflow-auto max-h-40">
                {error.stringified}
              </pre>
            </details>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
