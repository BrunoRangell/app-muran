
import { Loader } from "lucide-react";

export const LoadingState = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 gap-4">
      <Loader className="h-8 w-8 animate-spin text-muran-primary" />
      <p className="text-gray-600">Carregando clientes...</p>
    </div>
  );
};
