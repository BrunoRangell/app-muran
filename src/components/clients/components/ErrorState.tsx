
import { X } from "lucide-react";

export const ErrorState = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-red-500 gap-4 animate-fade-in">
      <div className="p-4 bg-red-50 rounded-full">
        <X className="h-8 w-8" />
      </div>
      <h2 className="text-xl font-semibold">Erro ao carregar dados</h2>
      <p className="text-center text-gray-600">
        Você não tem permissão para visualizar os clientes ou ocorreu um erro de conexão.
      </p>
    </div>
  );
};
