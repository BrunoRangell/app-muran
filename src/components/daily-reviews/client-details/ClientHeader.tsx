
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface ClientHeaderProps {
  onBack: () => void;
}

export const ClientHeader = ({ onBack }: ClientHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <Button variant="outline" onClick={onBack} className="flex gap-1">
        <ArrowLeft size={16} />
        Voltar
      </Button>
    </div>
  );
};
