
import { Loader } from "lucide-react";

interface ImprovedLoadingStateProps {
  message?: string;
}

export function ImprovedLoadingState({ message = "Carregando dados..." }: ImprovedLoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg shadow-sm">
      <Loader className="h-12 w-12 animate-spin text-[#ff6e00]" />
      <p className="mt-4 text-lg text-gray-600">{message}</p>
      <p className="mt-2 text-sm text-gray-500">Aguarde enquanto processamos suas informações</p>
    </div>
  );
}
