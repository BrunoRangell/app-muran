
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CustomBudgetForm } from "./CustomBudgetForm";
import { CustomBudgetFormData } from "../schemas/customBudgetSchema";

interface CustomBudget {
  id: string;
  client_id: string;
  platform: string;
  budget_amount: number;
  start_date: string;
  end_date: string;
  description?: string;
}

interface CustomBudgetDialogProps {
  open: boolean;
  onClose: () => void;
  budget?: CustomBudget;
  onSubmit: (data: CustomBudgetFormData) => Promise<void>;
  isLoading?: boolean;
}

export function CustomBudgetDialog({ 
  open, 
  onClose, 
  budget, 
  onSubmit, 
  isLoading 
}: CustomBudgetDialogProps) {
  const initialData = budget ? {
    id: budget.id,
    platform: budget.platform as "meta" | "google",
    client_id: budget.client_id,
    budget_amount: budget.budget_amount,
    start_date: new Date(budget.start_date),
    end_date: new Date(budget.end_date),
    description: budget.description || "",
  } : undefined;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {budget ? "Editar Orçamento Personalizado" : "Novo Orçamento Personalizado"}
          </DialogTitle>
        </DialogHeader>
        <CustomBudgetForm
          initialData={initialData}
          onSubmit={onSubmit}
          onCancel={onClose}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
}
