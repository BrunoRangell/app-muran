
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  error?: Error;
  onRetry?: () => void;
}

export const ErrorState = ({ error, onRetry }: ErrorStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 gap-4">
      <AlertCircle className="h-12 w-12 text-red-500" />
      <h3 className="text-xl font-semibold">Erro ao carregar dados</h3>
      <p className="text-gray-600">
        Não foi possível carregar os dados. Tente novamente mais tarde.
      </p>
      {error && (
        <p className="text-sm text-gray-500 mt-2">{error.message}</p>
      )}
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="mt-2">
          Tentar novamente
        </Button>
      )}
    </div>
  );
};
