
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CostForm } from "./CostForm";
import { useNewCostForm } from "./hooks/useNewCostForm";
import { NewCostDialogProps } from "./schemas/costFormSchema";

export function NewCostDialog({ open, onOpenChange }: NewCostDialogProps) {
  const { form, isLoading, handleAmountChange, onSubmit, resetForm } = useNewCostForm(onOpenChange);

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Custo</DialogTitle>
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
