
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ClientForm } from "@/components/admin/ClientForm";
import { Client } from "../types";

interface ClientsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedClient: Client | null;
}

export const ClientsDialog = ({ isOpen, onOpenChange, selectedClient }: ClientsDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <ClientForm
          initialData={selectedClient}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};
