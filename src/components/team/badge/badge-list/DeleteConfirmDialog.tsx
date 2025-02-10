
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  badgeName?: string;
  deleteType: "member" | "all" | null;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  badgeName,
  deleteType,
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            {deleteType === "member" ? (
              <>
                Tem certeza que deseja remover o emblema "{badgeName}" deste membro?
                <br />
                Esta ação não pode ser desfeita.
              </>
            ) : (
              <>
                Tem certeza que deseja excluir o emblema "{badgeName}" de todos os membros?
                <br />
                Esta ação não pode ser desfeita e removerá o emblema de todos os membros que o possuem.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <Button 
            variant="destructive" 
            onClick={onConfirm}
          >
            Excluir
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
