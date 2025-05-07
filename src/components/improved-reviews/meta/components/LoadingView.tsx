
import { Card, CardContent } from "@/components/ui/card";
import { Loader } from "lucide-react";

export const LoadingView = () => {
  return (
    <Card className="py-12">
      <CardContent className="flex flex-col items-center justify-center space-y-4">
        <Loader className="h-10 w-10 animate-spin text-[#ff6e00]" />
        <p className="text-lg font-medium text-gray-600">Carregando clientes...</p>
        <p className="text-sm text-gray-500">Buscando dados mais recentes dos clientes e revisões</p>
      </CardContent>
    </Card>
  );
};
