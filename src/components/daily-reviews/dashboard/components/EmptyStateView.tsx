
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface EmptyStateViewProps {
  message?: string;
}

export const EmptyStateView = ({ message = "Nenhum cliente encontrado com os filtros atuais." }: EmptyStateViewProps) => {
  return (
    <Card className="py-12 text-center">
      <AlertCircle className="mx-auto mb-4 text-gray-400" size={32} />
      <p className="text-gray-500">{message}</p>
    </Card>
  );
};
