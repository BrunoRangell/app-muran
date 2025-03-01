
import { Loader } from "lucide-react";

export const LoadingState = () => {
  return (
    <div className="flex justify-center items-center h-64">
      <Loader className="animate-spin mr-2" />
      <span>Carregando detalhes do cliente...</span>
    </div>
  );
};
