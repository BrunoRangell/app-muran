
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CostForm } from "./CostForm";
import { Cost } from "@/types/cost";
import { useEditCostForm } from "./hooks/useEditCostForm";

interface EditCostDialogProps {
  cost: Cost | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCostDialog({ cost, open, onOpenChange }: EditCostDialogProps) {
  const { form, isLoading, handleAmountChange, onSubmit, resetForm } = useEditCostForm(cost, onOpenChange);

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  if (!cost) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Custo</DialogTitle>
        </DialogHeader>

        <CostForm
          form={form}
          isLoading={isLoading}
          onSubmit={onSubmit}
          handleAmountChange={handleAmountChange}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}
