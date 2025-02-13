
import { Button } from "@/components/ui/button";

interface ImportActionsProps {
  isLoading: boolean;
  hasSelectedTransactions: boolean;
  onCancel: () => void;
  onImport: () => void;
}

export function ImportActions({ isLoading, hasSelectedTransactions, onCancel, onImport }: ImportActionsProps) {
  return (
    <div className="flex justify-end gap-2 pt-4">
      <Button
        variant="outline"
        onClick={onCancel}
        disabled={isLoading}
      >
        Cancelar
      </Button>
      <Button
        onClick={onImport}
        disabled={isLoading || !hasSelectedTransactions}
      >
        {isLoading ? "Importando..." : "Importar Selecionados"}
      </Button>
    </div>
  );
}
