
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface EmptyStateViewProps {
  platform?: "meta" | "google";
}

export const EmptyStateView = ({ platform = "meta" }: EmptyStateViewProps) => {
  const platformName = platform === "meta" ? "Meta Ads" : "Google Ads";
  
  return (
    <Card className="py-12 text-center">
      <AlertCircle className="mx-auto mb-4 text-gray-400" size={32} />
      <p className="text-gray-500">
        Nenhum cliente encontrado com os filtros atuais para {platformName}.
      </p>
    </Card>
  );
};
