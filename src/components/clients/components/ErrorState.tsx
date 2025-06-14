
import { AlertCircle } from "lucide-react";

export const ErrorState = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 gap-4">
      <AlertCircle className="h-12 w-12 text-red-500" />
      <h3 className="text-xl font-semibold">Erro ao carregar dados</h3>
      <p className="text-gray-600">
        Não foi possível carregar os dados. Tente novamente mais tarde.
      </p>
    </div>
  );
};
