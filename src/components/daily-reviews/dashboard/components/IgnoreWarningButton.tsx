
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EyeOff, Loader } from "lucide-react";
import { IgnoreWarningDialog } from "./IgnoreWarningDialog";

interface IgnoreWarningButtonProps {
  clientId: string;
  clientName: string;
  onWarningIgnored?: () => void;
}

export function IgnoreWarningButton({ 
  clientId, 
  clientName, 
  onWarningIgnored 
}: IgnoreWarningButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      // A lógica de ignorar o aviso está no IgnoreWarningDialog
      setIsDialogOpen(false);
      
      // Chama o callback para atualizar a interface
      if (onWarningIgnored) {
        onWarningIgnored();
      }
    } catch (error) {
      console.error("Erro ao processar:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsDialogOpen(true)}
        disabled={isProcessing}
        className="text-gray-600 border-gray-300 hover:bg-gray-50 hover:text-gray-700"
      >
        {isProcessing ? (
          <>
            <Loader className="mr-2 h-3 w-3 animate-spin" />
            Processando...
          </>
        ) : (
          <>
            <EyeOff className="mr-2 h-3 w-3" />
            Ignorar aviso
          </>
        )}
      </Button>

      <IgnoreWarningDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={handleConfirm}
        clientId={clientId}
        clientName={clientName}
        onWarningIgnored={onWarningIgnored}
      />
    </>
  );
}
