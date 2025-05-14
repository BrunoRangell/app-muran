
import { RefreshCw } from "lucide-react";

interface ImprovedLoadingStateProps {
  message?: string;
}

export function ImprovedLoadingState({ message = "Carregando dados..." }: ImprovedLoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-64 bg-white rounded-md shadow-sm p-8 border border-gray-100">
      <RefreshCw className="h-12 w-12 text-[#ff6e00] animate-spin mb-4" />
      <h3 className="text-lg font-medium text-gray-700">{message}</h3>
      <p className="text-gray-500 mt-2 text-center">
        Estamos preparando seus dados para revisão. Isso pode levar alguns instantes.
      </p>
    </div>
  );
}
