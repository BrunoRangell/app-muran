
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface ClientNotFoundProps {
  onBack: () => void;
}

export const ClientNotFound = ({ onBack }: ClientNotFoundProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <AlertCircle className="w-16 h-16 text-muran-primary" />
      <h2 className="text-2xl font-bold text-gray-800">Cliente não encontrado</h2>
      <p className="text-gray-600">
        Não foi possível encontrar os dados deste cliente. Verifique se o ID está correto.
      </p>
      <Button onClick={onBack} className="bg-muran-primary hover:bg-muran-primary/90 text-white">
        Voltar para a lista de clientes
      </Button>
    </div>
  );
};
