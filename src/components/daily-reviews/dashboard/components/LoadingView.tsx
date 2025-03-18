
import { Loader } from "lucide-react";

export const LoadingView = () => {
  return (
    <div className="py-8 flex justify-center items-center">
      <Loader className="animate-spin w-8 h-8 text-muran-primary" />
      <span className="ml-3 text-gray-500">Carregando clientes...</span>
    </div>
  );
};
