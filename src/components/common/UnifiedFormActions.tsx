
import { Button } from "@/components/ui/button";
import { Loader2, Save, X, Trash2 } from "lucide-react";

interface UnifiedFormActionsProps {
  isSubmitting?: boolean;
  onCancel?: () => void;
  onDelete?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  deleteLabel?: string;
  showCancel?: boolean;
  showDelete?: boolean;
  disabled?: boolean;
  className?: string;
}

export function UnifiedFormActions({
  isSubmitting = false,
  onCancel,
  onDelete,
  submitLabel = "Salvar",
  cancelLabel = "Cancelar",
  deleteLabel = "Excluir",
  showCancel = true,
  showDelete = false,
  disabled = false,
  className = "flex gap-2 justify-end",
}: UnifiedFormActionsProps) {
  return (
    <div className={className}>
      {showDelete && onDelete && (
        <Button
          type="button"
          variant="destructive"
          onClick={onDelete}
          disabled={disabled || isSubmitting}
          className="mr-auto"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          {deleteLabel}
        </Button>
      )}
      
      {showCancel && onCancel && (
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          <X className="h-4 w-4 mr-2" />
          {cancelLabel}
        </Button>
      )}
      
      <Button
        type="submit"
        disabled={disabled || isSubmitting}
        className="bg-[#ff6e00] hover:bg-[#e56200]"
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Save className="h-4 w-4 mr-2" />
        )}
        {submitLabel}
      </Button>
    </div>
  );
}
