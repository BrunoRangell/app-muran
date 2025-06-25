
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface IgnoreWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  clientName: string;
}

export function IgnoreWarningDialog({ 
  open, 
  onOpenChange, 
  onConfirm, 
  clientName 
}: IgnoreWarningDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ignorar recomendação de ajuste</AlertDialogTitle>
          <AlertDialogDescription>
            A recomendação de ajuste para <strong>{clientName}</strong> não irá mais aparecer durante o dia de hoje, mesmo com novas revisões. Ela reaparecerá amanhã se necessário. Você confirma esta ação?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            className="bg-[#ff6e00] hover:bg-[#e66300]"
          >
            Sim, Confirmar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
