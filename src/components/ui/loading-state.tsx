
import { Loader } from "lucide-react";

interface LoadingStateProps {
  message?: string;
}

export const LoadingState = ({ message = "Carregando..." }: LoadingStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 gap-4 animate-fade-in">
      <Loader className="h-8 w-8 animate-spin text-muran-primary" />
      <p className="text-gray-600">{message}</p>
    </div>
  );
};
