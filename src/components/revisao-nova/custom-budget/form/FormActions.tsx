
import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";

interface FormActionsProps {
  isSubmitting: boolean;
  onCancel: () => void;
  isEditing: boolean;
}

export function FormActions({ isSubmitting, onCancel, isEditing }: FormActionsProps) {
  return (
    <div className="flex justify-end gap-3 pt-2">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isSubmitting}
      >
        Cancelar
      </Button>
      <Button
        type="submit"
        className="bg-muran-primary hover:bg-muran-primary/90"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader className="mr-2 h-4 w-4 animate-spin" />
            Salvando...
          </>
        ) : (
          isEditing ? "Atualizar Orçamento" : "Adicionar Orçamento"
        )}
      </Button>
    </div>
  );
}
